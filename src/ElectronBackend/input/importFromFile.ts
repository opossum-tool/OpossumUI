// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import { cloneDeep } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  Attributions,
  ParsedFileContent,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { getGlobalBackendState } from '../main/globalBackendState';
import logger from '../main/logger';
import {
  InvalidDotOpossumFileError,
  JsonParsingError,
  OpossumOutputFile,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../types/types';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import { isOpossumFileFormat } from '../utils/isOpossumFileFormat';
import {
  parseInputJsonFile,
  parseOpossumFile,
  parseOutputJsonFile,
} from './parseFile';
import {
  deserializeAttributions,
  getAttributionsToResources,
  mergeAttributions,
  parseFrequentLicenses,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
  serializeAttributions,
} from './parseInputData';

function isJsonParsingError(object: unknown): object is JsonParsingError {
  return (object as JsonParsingError).type === 'jsonParsingError';
}

function isInvalidDotOpossumFileError(
  object: unknown,
): object is InvalidDotOpossumFileError {
  return (
    (object as InvalidDotOpossumFileError).type === 'invalidDotOpossumFileError'
  );
}

export async function loadInputAndOutputFromFilePath(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  mainWindow.webContents.send(AllowedFrontendChannels.ResetLoadedFile, {
    resetState: true,
  });

  let parsedInputData: ParsedOpossumInputFile;
  let parsedOutputData: ParsedOpossumOutputFile | null = null;

  if (isOpossumFileFormat(filePath)) {
    logger.info(`Reading file ${filePath}`);
    const parsingResult = await parseOpossumFile(filePath);
    if (isJsonParsingError(parsingResult)) {
      logger.info('Invalid input file');
      await getMessageBoxForParsingError(parsingResult.message);
      return;
    }
    if (isInvalidDotOpossumFileError(parsingResult)) {
      logger.info('Invalid input file');
      mainWindow.webContents.send(AllowedFrontendChannels.FileLoading, {
        isLoading: false,
      });
      await getMessageBoxForInvalidDotOpossumFileError(
        parsingResult.filesInArchive,
      );
      return;
    }
    parsedInputData = parsingResult.input;
    parsedOutputData = parsingResult.output;
  } else {
    logger.info('Parsing input file');
    const parsingResult = await parseInputJsonFile(filePath);
    if (isJsonParsingError(parsingResult)) {
      logger.info('Invalid input file');
      await getMessageBoxForParsingError(parsingResult.message);
      return;
    }
    parsedInputData = parsingResult;
  }

  logger.info('Sanitizing map of resources to signals');
  const unmergedResourcesToExternalAttributions =
    sanitizeResourcesToAttributions(
      parsedInputData.resources,
      parsedInputData.resourcesToAttributions,
    );

  logger.info('Deserializing signals');
  const unmergedExternalAttributions = deserializeAttributions(
    parsedInputData.externalAttributions,
  );

  logger.info('Calculating signals to resources');
  const externalAttributionsToResources = getAttributionsToResources(
    unmergedResourcesToExternalAttributions,
  );

  logger.info('Merging similar signals');
  const [externalAttributions, resourcesToExternalAttributions] =
    mergeAttributions({
      attributions: unmergedExternalAttributions,
      resourcesToAttributions: unmergedResourcesToExternalAttributions,
      attributionsToResources: externalAttributionsToResources,
    });

  logger.info('Parsing frequent licenses from input');
  const frequentLicenses = parseFrequentLicenses(
    parsedInputData.frequentLicenses,
  );

  if (parsedOutputData === null) {
    logger.info('Creating output file');
    if (isOpossumFileFormat(filePath)) {
      parsedOutputData = await createOutputInOpossumFile(
        filePath,
        externalAttributions,
        resourcesToExternalAttributions,
        parsedInputData.metadata.projectId,
      );
    } else {
      const outputJsonPath = getFilePathWithAppendix(
        filePath,
        '_attributions.json',
      );
      const inputFileMD5Checksum = getGlobalBackendState().inputFileChecksum;
      parsedOutputData = await parseOrCreateOutputJsonFile(
        outputJsonPath,
        externalAttributions,
        resourcesToExternalAttributions,
        parsedInputData.metadata.projectId,
        inputFileMD5Checksum,
      );
    }
  }

  logger.info('Calculating attributions to resources');
  const manualAttributionsToResources = getAttributionsToResources(
    parsedOutputData.resourcesToAttributions,
  );

  logger.info('Deserializing attributions');
  const manualAttributions = deserializeAttributions(
    parsedOutputData.manualAttributions,
  );

  logger.info('Sending data to user interface');
  mainWindow.webContents.send(AllowedFrontendChannels.FileLoaded, {
    metadata: parsedInputData.metadata,
    resources: parsedInputData.resources,
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
    filesWithChildren: new Set(parsedInputData.filesWithChildren),
    baseUrlsForSources: sanitizeRawBaseUrlsForSources(
      parsedInputData.baseUrlsForSources,
    ),
    externalAttributionSources:
      parsedInputData.externalAttributionSources ?? {},
  } satisfies ParsedFileContent);

  logger.info('Finalizing global state');
  getGlobalBackendState().projectTitle = parsedInputData.metadata.projectTitle;
  getGlobalBackendState().projectId = parsedInputData.metadata.projectId;
}

async function createOutputInOpossumFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
): Promise<ParsedOpossumOutputFile> {
  logger.info('Preparing output');
  const attributionJSON = createJsonOutputFile(
    externalAttributions,
    resourcesToExternalAttributions,
    projectId,
  );
  await writeOpossumFile({
    path: filePath,
    input: getGlobalBackendState().inputFileRaw,
    output: attributionJSON,
  });
  logger.info('Parsing output');
  const parsingResult = (await parseOpossumFile(
    filePath,
  )) as ParsedOpossumInputAndOutput;
  const parsedOutputFile = parsingResult.output as ParsedOpossumOutputFile;
  return parsedOutputFile;
}

async function parseOrCreateOutputJsonFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
  inputFileMD5Checksum?: string,
): Promise<ParsedOpossumOutputFile> {
  if (!fs.existsSync(filePath)) {
    logger.info('Preparing output');
    const attributionJSON = createJsonOutputFile(
      externalAttributions,
      resourcesToExternalAttributions,
      projectId,
      inputFileMD5Checksum,
    );
    await writeFile({ path: filePath, content: attributionJSON });
  }

  logger.info('Parsing output');
  const parsedOutputFile = parseOutputJsonFile(filePath);
  return parsedOutputFile;
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

export async function getMessageBoxForParsingError(
  errorMessage: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Parsing Error',
    message: 'Error parsing the input file.',
    detail: errorMessage,
  });
}

export async function getMessageBoxForInvalidDotOpossumFileError(
  filesInArchive: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Invalid File Error',
    message: "Error loading '.opossum' file.",
    detail:
      "The '.opossum' file is invalid as it does not contain an 'input.json'. " +
      `Actual files in the archive: ${filesInArchive}.`,
  });
}
