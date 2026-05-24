// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { cloneDeep, omit } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import {
  type Attributions,
  EXCLUDED_FROM_FRONTEND_FILE_CONTENT,
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
import { parseOpossumParquetFile } from './parseParquetFile';
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
import { getParquetFilePath, isParquetFile } from './parquetFormat';
import { refineConfiguration } from './refineConfiguration';
import {
  writeInputParquetsToCache,
  writeOpossumParquetFile,
} from './writeParquetFile';

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

async function preprocessAndLoadIntoDb(
  parsedInputData: ParsedOpossumInputFile,
  parsedOutputDataIn: ParsedOpossumOutputFile | null,
  filePath: string,
  globalState: LoadFileGlobalState,
  reportProgress: LoadFileProgressCallback,
  inputFileRaw: Uint8Array | undefined,
): Promise<ParsedFileContent> {
  let parsedOutputData = parsedOutputDataIn;

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

  return parsedFileContent;
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

  const tWholeStart = performance.now();

  let parsedInputData: ParsedOpossumInputFile;
  let parsedOutputData: ParsedOpossumOutputFile | null = null;
  let inputFileRaw: Uint8Array | undefined;

  const tParseStart = performance.now();
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
  const msParseJson = performance.now() - tParseStart;

  const tPreprocessStart = performance.now();
  const parsedFileContent = await preprocessAndLoadIntoDb(
    parsedInputData,
    parsedOutputData,
    filePath,
    globalState,
    reportProgress,
    inputFileRaw,
  );
  const msPreprocessJson = performance.now() - tPreprocessStart;
  const msJsonTotal = performance.now() - tWholeStart;

  console.log(
    `[parquet-bench] JSON path: parse=${msParseJson.toFixed(1)}ms, ` +
      `preprocess+initDb=${msPreprocessJson.toFixed(1)}ms, ` +
      `total=${msJsonTotal.toFixed(1)}ms`,
  );

  await maybeRunParquetBenchmark({
    filePath,
    parsedInputData,
    parsedFileContent,
    globalState,
    reportProgress,
  });

  const frontendData: ParsedFrontendFileContent = omit(
    parsedFileContent,
    EXCLUDED_FROM_FRONTEND_FILE_CONTENT,
  );

  return {
    ok: true,
    frontendData,
    inputFileRaw,
    projectTitle: parsedInputData.metadata.projectTitle,
    projectId: parsedInputData.metadata.projectId,
  };
}

async function maybeRunParquetBenchmark({
  filePath,
  parsedInputData,
  parsedFileContent,
  globalState,
  reportProgress,
}: {
  filePath: string;
  parsedInputData: ParsedOpossumInputFile;
  parsedFileContent: ParsedFileContent;
  globalState: LoadFileGlobalState;
  reportProgress: LoadFileProgressCallback;
}): Promise<void> {
  if (!isOpossumFileFormat(filePath) || isParquetFile(filePath)) {
    return;
  }
  const projectId = parsedInputData.metadata.projectId;
  const parquetPath = getParquetFilePath(filePath);

  try {
    reportProgress('Populating parquet input cache');
    const tCacheStart = performance.now();
    const { msPerTable: cacheMsPerTable } = await writeInputParquetsToCache(
      projectId,
      parsedInputData,
    );
    const msCache = performance.now() - tCacheStart;
    console.log(
      `[parquet-bench] input cache (build) total=${msCache.toFixed(1)}ms`,
      cacheMsPerTable,
    );

    if (!fs.existsSync(parquetPath)) {
      reportProgress('Writing initial parquet archive');
      const outputFile: OpossumOutputFile = {
        metadata: {
          projectId,
          fileCreationDate: String(Date.now()),
          inputFileMD5Checksum: globalState.inputFileChecksum,
        },
        manualAttributions: serializeAttributions(
          parsedFileContent.manualAttributions.attributions,
        ),
        resourcesToAttributions:
          parsedFileContent.manualAttributions.resourcesToAttributions,
        resolvedExternalAttributions: Array.from(
          parsedFileContent.resolvedExternalAttributions,
        ),
      };
      const writeTimings = await writeOpossumParquetFile({
        archivePath: parquetPath,
        projectId,
        outputFile,
      });
      console.log(
        `[parquet-bench] initial archive write total=${writeTimings.msTotal.toFixed(1)}ms, ` +
          `size=${writeTimings.archiveBytes} bytes`,
        writeTimings.msPerTable,
      );
    }

    reportProgress('Re-loading from parquet archive');
    const tParseParquetStart = performance.now();
    const parquetResult = await parseOpossumParquetFile(parquetPath);
    const msParseParquet = performance.now() - tParseParquetStart;
    console.log(
      `[parquet-bench] Parquet parse total=${msParseParquet.toFixed(1)}ms ` +
        `(reported=${parquetResult.msTotal.toFixed(1)}ms)`,
      parquetResult.msPerTable,
    );

    const tPreprocessParquetStart = performance.now();
    await preprocessAndLoadIntoDb(
      parquetResult.result.input,
      parquetResult.result.output,
      filePath,
      globalState,
      reportProgress,
      parquetResult.result.inputFileRaw,
    );
    const msPreprocessParquet = performance.now() - tPreprocessParquetStart;
    const msParquetTotal = msParseParquet + msPreprocessParquet;
    console.log(
      `[parquet-bench] Parquet path: parse=${msParseParquet.toFixed(1)}ms, ` +
        `preprocess+initDb=${msPreprocessParquet.toFixed(1)}ms, ` +
        `total=${msParquetTotal.toFixed(1)}ms`,
    );
  } catch (err) {
    console.error('[parquet-bench] error during benchmark:', err);
  }
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
  return attributionJSON;
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
