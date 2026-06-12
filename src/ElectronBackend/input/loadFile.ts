// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { cloneDeep } from 'lodash-es';
import { v4 as uuid4 } from 'uuid';

import type {
  Attributions,
  ParsedFileContent,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { saveFile } from '../api/saveFile';
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
  serializeAttributions,
} from './parseInputData';
import { refineConfiguration } from './refineConfiguration';

export interface LoadFileSuccess {
  ok: true;
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

  reportProgress('Deserializing signals');
  const unmergedExternalAttributions = deserializeAttributions(
    parsedInputData.externalAttributions,
  );

  reportProgress('Calculating signals to resources');
  const externalAttributionsToResources = getAttributionsToResources(
    parsedInputData.resourcesToAttributions,
  );

  reportProgress('Merging similar signals');
  const [externalAttributions, resourcesToExternalAttributions] =
    mergeAttributions({
      attributions: unmergedExternalAttributions,
      // mergeAttributions reassigns keys on the map it receives, so pass a copy
      // to avoid mutating the parsed input.
      resourcesToAttributions: { ...parsedInputData.resourcesToAttributions },
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

  // When no output exists yet we build it in memory only. The file itself is
  // written further down via `saveFile` - i.e. the exact same serialization
  // path used by every later save - so freshly-created output stays consistent
  // with saved output (e.g. trailing-slash handling for files-with-children).
  let createdOutputNeedsPersisting = false;
  if (parsedOutputData === null) {
    const outputJsonPath = isOpossumFileFormat(filePath)
      ? undefined
      : getFilePathWithAppendix(filePath, '_attributions.json');

    if (outputJsonPath !== undefined && fs.existsSync(outputJsonPath)) {
      parsedOutputData = parseOutputJsonFile(outputJsonPath);
    } else {
      reportProgress('Creating output file');
      parsedOutputData = createJsonOutputFile(
        externalAttributions,
        resourcesToExternalAttributions,
        parsedInputData.metadata.projectId,
        globalState.inputFileChecksum,
      );
      createdOutputNeedsPersisting = true;
    }
  }

  const filesWithChildrenSet = new Set(
    parsedInputData.filesWithChildren?.map(addTrailingSlashIfAbsent),
  );

  reportProgress('Calculating attributions to resources');
  const manualAttributionsToResources = getAttributionsToResources(
    parsedOutputData.resourcesToAttributions,
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
      resourcesToAttributions: parsedOutputData.resourcesToAttributions,
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

  if (createdOutputNeedsPersisting) {
    reportProgress('Writing output file');
    await saveFile(
      isOpossumFileFormat(filePath)
        ? {
            projectId: parsedInputData.metadata.projectId,
            opossumFilePath: filePath,
          }
        : {
            projectId: parsedInputData.metadata.projectId,
            inputFileChecksum: globalState.inputFileChecksum,
            attributionFilePath: getFilePathWithAppendix(
              filePath,
              '_attributions.json',
            ),
          },
      inputFileRaw ?? new Uint8Array(),
    );
  }

  return {
    ok: true,
    inputFileRaw,
    projectTitle: parsedInputData.metadata.projectTitle,
    projectId: parsedInputData.metadata.projectId,
  };
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
