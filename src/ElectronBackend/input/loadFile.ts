// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { cloneDeep, pick } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import {
  type Attributions,
  INCLUDE_IN_FRONTEND_FILE_CONTENT,
  type ParsedFileContent,
  type ParsedFrontendFileContent,
  type ResourcesToAttributions,
} from '../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { initializeDb } from '../db/initializeDb';
import type {
  FileNotFoundError,
  OpossumOutputFile,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
  ParsingError,
} from '../types/types';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { isOpossumFileFormat } from '../utils/isOpossumFileFormat';
import {
  parseInputJsonFile,
  parseOpossumFile,
  parseOutputJsonFile,
} from './parseFile';
import {
  addTrailingSlashIfAbsent,
  deserializeAttributions,
  getAttributionsToResources,
  mergeAttributions,
  parseFrequentLicenses,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
  serializeAttributions,
} from './parseInputData';
import { refineConfiguration } from './refineConfiguration';

export interface LoadFileSuccess {
  ok: true;
  frontendData: ParsedFrontendFileContent;
  inputFileRaw?: Uint8Array;
  projectTitle?: string;
  projectId: string;
}

export interface LoadFileError {
  ok: false;
  error: ParsingError;
}

type LoadFileResult = LoadFileSuccess | LoadFileError;

export type LoadFileIpcResult =
  | Omit<LoadFileSuccess, 'inputFileRaw'>
  | LoadFileError;

export interface LoadFileGlobalState {
  inputFileChecksum?: string;
}

export type LoadFileProgressCallback = (
  message: string,
  level?: 'info' | 'warn',
) => void;

const PARSING_ERROR_TYPES: ReadonlySet<string> = new Set<ParsingError['type']>([
  'fileNotFoundError',
  'jsonParsingError',
  'invalidDotOpossumFileError',
  'unzipError',
]);

function isParsingError(parsingResult: unknown): parsingResult is ParsingError {
  return (
    typeof parsingResult === 'object' &&
    parsingResult !== null &&
    'type' in parsingResult &&
    PARSING_ERROR_TYPES.has((parsingResult as ParsingError).type)
  );
}

export async function loadFile(
  filePath: string,
  globalState: LoadFileGlobalState,
  reportProgress: LoadFileProgressCallback = () => {},
): Promise<LoadFileResult> {
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      error: {
        message: `Error: ${filePath} does not exist.`,
        type: 'fileNotFoundError',
      } satisfies FileNotFoundError,
    };
  }

  let parsedInputData: ParsedOpossumInputFile;
  let parsedOutputData: ParsedOpossumOutputFile | null = null;
  let inputFileRaw: Uint8Array | undefined;

  if (isOpossumFileFormat(filePath)) {
    reportProgress(`Reading file ${filePath}`);
    const parsingResult = await parseOpossumFile(filePath);
    if (isParsingError(parsingResult)) {
      return { ok: false, error: parsingResult };
    }
    parsedInputData = parsingResult.input;
    parsedOutputData = parsingResult.output;
    inputFileRaw = parsingResult.inputFileRaw;
  } else {
    reportProgress('Parsing input file');
    const parsingResult = await parseInputJsonFile(filePath);
    if (isParsingError(parsingResult)) {
      return { ok: false, error: parsingResult };
    }
    parsedInputData = parsingResult;
  }

  reportProgress('Sanitizing map of resources to signals');
  const unmergedResourcesToExternalAttributions =
    sanitizeResourcesToAttributions(
      parsedInputData.resources,
      parsedInputData.resourcesToAttributions,
    );

  reportProgress('Deserializing signals');
  const unmergedExternalAttributions = deserializeAttributions(
    parsedInputData.externalAttributions,
  );

  reportProgress('Calculating signals to resources');
  const externalAttributionsToResources = getAttributionsToResources(
    unmergedResourcesToExternalAttributions,
  );

  reportProgress('Merging similar signals');
  const [externalAttributions, resourcesToExternalAttributions] =
    mergeAttributions({
      attributions: unmergedExternalAttributions,
      resourcesToAttributions: unmergedResourcesToExternalAttributions,
      attributionsToResources: externalAttributionsToResources,
    });

  reportProgress('Parsing frequent licenses from input');
  const frequentLicenses = parseFrequentLicenses(
    parsedInputData.frequentLicenses,
  );

  reportProgress('Checking and converting configuration');
  const configuration = refineConfiguration(
    parsedInputData.config,
    externalAttributions,
    { warn: (msg: string) => reportProgress(msg, 'warn') },
  );

  if (parsedOutputData === null) {
    reportProgress('Creating output file');
    if (isOpossumFileFormat(filePath)) {
      parsedOutputData = await createOutputInOpossumFile(
        filePath,
        externalAttributions,
        resourcesToExternalAttributions,
        parsedInputData.metadata.projectId,
        inputFileRaw,
      );
    } else {
      const outputJsonPath = getFilePathWithAppendix(
        filePath,
        '_attributions.json',
      );
      parsedOutputData = await parseOrCreateOutputJsonFile(
        outputJsonPath,
        externalAttributions,
        resourcesToExternalAttributions,
        parsedInputData.metadata.projectId,
        globalState.inputFileChecksum,
      );
    }
  }

  const filesWithChildrenSet = new Set(
    parsedInputData.filesWithChildren?.map(addTrailingSlashIfAbsent),
  );

  reportProgress('Sanitizing map of resources to attributions');
  const normalizedOutputResourcesToAttributions =
    sanitizeResourcesToAttributions(
      parsedInputData.resources,
      parsedOutputData.resourcesToAttributions,
    );

  reportProgress('Calculating attributions to resources');
  const manualAttributionsToResources = getAttributionsToResources(
    normalizedOutputResourcesToAttributions,
  );

  reportProgress('Deserializing attributions');
  const manualAttributions = deserializeAttributions(
    parsedOutputData.manualAttributions,
    externalAttributions,
  );

  const parsedFileContent = {
    metadata: parsedInputData.metadata,
    resources: parsedInputData.resources,
    config: configuration,
    manualAttributions: {
      attributions: manualAttributions,
      resourcesToAttributions: normalizedOutputResourcesToAttributions,
      attributionsToResources: manualAttributionsToResources,
    },
    externalAttributions: {
      attributions: externalAttributions,
      resourcesToAttributions: resourcesToExternalAttributions,
      attributionsToResources: externalAttributionsToResources,
    },
    frequentLicenses,
    resolvedExternalAttributions: new Set(
      parsedOutputData.resolvedExternalAttributions,
    ),
    attributionBreakpoints: new Set(parsedInputData.attributionBreakpoints),
    filesWithChildren: filesWithChildrenSet,
    baseUrlsForSources: sanitizeRawBaseUrlsForSources(
      parsedInputData.baseUrlsForSources,
    ),
    externalAttributionSources:
      parsedInputData.externalAttributionSources ?? {},
  } satisfies ParsedFileContent;

  reportProgress('Loading into database');
  await initializeDb(parsedFileContent);

  const frontendData: ParsedFrontendFileContent = pick(
    parsedFileContent,
    INCLUDE_IN_FRONTEND_FILE_CONTENT,
  );

  return {
    ok: true,
    frontendData,
    inputFileRaw,
    projectTitle: parsedInputData.metadata.projectTitle,
    projectId: parsedInputData.metadata.projectId,
  };
}

async function createOutputInOpossumFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
  inputFileRaw?: Uint8Array,
): Promise<ParsedOpossumOutputFile> {
  const attributionJSON = createJsonOutputFile(
    externalAttributions,
    resourcesToExternalAttributions,
    projectId,
  );
  await writeOpossumFile({
    path: filePath,
    input: inputFileRaw,
    output: attributionJSON,
  });
  return attributionJSON as ParsedOpossumOutputFile;
}

async function parseOrCreateOutputJsonFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
  inputFileMD5Checksum?: string,
): Promise<ParsedOpossumOutputFile> {
  if (!fs.existsSync(filePath)) {
    const attributionJSON = createJsonOutputFile(
      externalAttributions,
      resourcesToExternalAttributions,
      projectId,
      inputFileMD5Checksum,
    );
    await writeFile({ path: filePath, content: attributionJSON });
  }

  return parseOutputJsonFile(filePath);
}

function createJsonOutputFile(
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
  inputFileMD5Checksum?: string,
): OpossumOutputFile {
  const externalAttributionsCopy = cloneDeep(externalAttributions);

  const manualAttributions: Attributions = {};
  const manualAttributionIdsToExternalAttributionIds: {
    [attributionId: string]: string;
  } = {};
  const manualAttributionIds = new Set<string>();
  for (const attributionId of Object.keys(externalAttributionsCopy)) {
    const packageInfo = externalAttributionsCopy[attributionId];
    if (packageInfo.preSelected) {
      delete packageInfo.source;
      delete packageInfo.preferred;
      delete packageInfo.preferredOverOriginIds;

      const newUUID = uuid4();
      manualAttributions[newUUID] = packageInfo;
      manualAttributionIdsToExternalAttributionIds[attributionId] = newUUID;

      manualAttributionIds.add(attributionId);
    }
  }

  const resourcesToAttributions: ResourcesToAttributions = {};
  for (const resourceId of Object.keys(resourcesToExternalAttributions)) {
    const attributionIds = resourcesToExternalAttributions[resourceId];
    const filteredAttributionIds = attributionIds.filter((attributionId) =>
      manualAttributionIds.has(attributionId),
    );

    if (filteredAttributionIds.length) {
      resourcesToAttributions[resourceId] = filteredAttributionIds.map(
        (attributionId) =>
          manualAttributionIdsToExternalAttributionIds[attributionId],
      );
    }
  }

  return {
    metadata: {
      projectId,
      fileCreationDate: String(Date.now()),
      inputFileMD5Checksum,
    },
    manualAttributions: serializeAttributions(manualAttributions),
    resourcesToAttributions,
    resolvedExternalAttributions: [],
  };
}
