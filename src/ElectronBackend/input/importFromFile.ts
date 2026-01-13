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
import { text } from '../../shared/text';
import { writeFile, writeOpossumFile } from '../../shared/write-file';
import { getGlobalBackendState } from '../main/globalBackendState';
import { ProcessingStatusUpdater } from '../main/ProcessingStatusUpdater';
import {
  FileNotFoundError,
  OpossumOutputFile,
  ParsedOpossumInputAndOutput,
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

function isParsingError(
  parsingResult:
    | ParsedOpossumInputFile
    | ParsedOpossumInputAndOutput
    | ParsingError,
): parsingResult is ParsingError {
  return 'type' in parsingResult;
}

async function handleParsingError(
  parsingError: ParsingError,
  processingStatusUpdater: ProcessingStatusUpdater,
) {
  processingStatusUpdater.info('Invalid input file');
  switch (parsingError.type) {
    case 'unzipError':
      await getMessageBoxForUnzipError(parsingError.message);
      return;
    case 'fileNotFoundError':
      await getMessageBoxForFileNotFoundError(parsingError.message);
      return;
    case 'jsonParsingError':
      await getMessageBoxForParsingError(parsingError.message);
      return;
    case 'invalidDotOpossumFileError':
      processingStatusUpdater.endProcessing();
      await getMessageBoxForInvalidDotOpossumFileError(parsingError.message);
  }
}

export async function loadInputAndOutputFromFilePath(
  mainWindow: BrowserWindow,
  filePath: string,
): Promise<void> {
  mainWindow.webContents.send(AllowedFrontendChannels.ResetLoadedFile, {
    resetState: true,
  });

  const processingStatusUpdater = new ProcessingStatusUpdater(
    mainWindow.webContents,
  );
  let parsedInputData: ParsedOpossumInputFile;
  let parsedOutputData: ParsedOpossumOutputFile | null = null;

  if (!fs.existsSync(filePath)) {
    await handleParsingError(
      {
        message: `Error: ${filePath} does not exist.`,
        type: 'fileNotFoundError',
      } as FileNotFoundError,
      processingStatusUpdater,
    );
    return;
  }

  if (isOpossumFileFormat(filePath)) {
    processingStatusUpdater.info(`Reading file ${filePath}`);
    const parsingResult = await parseOpossumFile(filePath);
    if (isParsingError(parsingResult)) {
      await handleParsingError(parsingResult, processingStatusUpdater);
      return;
    }
    parsedInputData = parsingResult.input;
    parsedOutputData = parsingResult.output;
  } else {
    processingStatusUpdater.info('Parsing input file');
    const parsingResult = await parseInputJsonFile(filePath);
    if (isParsingError(parsingResult)) {
      await handleParsingError(parsingResult, processingStatusUpdater);
      return;
    }
    parsedInputData = parsingResult;
  }

  processingStatusUpdater.info('Sanitizing map of resources to signals');
  const unmergedResourcesToExternalAttributions =
    sanitizeResourcesToAttributions(
      parsedInputData.resources,
      parsedInputData.resourcesToAttributions,
    );

  processingStatusUpdater.info('Deserializing signals');
  const unmergedExternalAttributions = deserializeAttributions(
    parsedInputData.externalAttributions,
  );

  processingStatusUpdater.info('Calculating signals to resources');
  const externalAttributionsToResources = getAttributionsToResources(
    unmergedResourcesToExternalAttributions,
  );

  processingStatusUpdater.info('Merging similar signals');
  const [externalAttributions, resourcesToExternalAttributions] =
    mergeAttributions({
      attributions: unmergedExternalAttributions,
      resourcesToAttributions: unmergedResourcesToExternalAttributions,
      attributionsToResources: externalAttributionsToResources,
    });

  processingStatusUpdater.info('Parsing frequent licenses from input');
  const frequentLicenses = parseFrequentLicenses(
    parsedInputData.frequentLicenses,
  );

  processingStatusUpdater.info('Checking and converting configuration');
  const configuration = refineConfiguration(
    parsedInputData.config,
    externalAttributions,
    processingStatusUpdater,
  );

  if (parsedOutputData === null) {
    processingStatusUpdater.info('Creating output file');
    if (isOpossumFileFormat(filePath)) {
      parsedOutputData = await createOutputInOpossumFile(
        filePath,
        externalAttributions,
        resourcesToExternalAttributions,
        parsedInputData.metadata.projectId,
        processingStatusUpdater,
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
        processingStatusUpdater,
        inputFileMD5Checksum,
      );
    }
  }

  const filesWithChildrenSet = new Set(
    parsedInputData.filesWithChildren?.map(addTrailingSlashIfAbsent),
  );

  processingStatusUpdater.info('Sanitizing map of resources to attributions');
  const normalizedOutputResourcesToAttributions =
    sanitizeResourcesToAttributions(
      parsedInputData.resources,
      parsedOutputData.resourcesToAttributions,
    );

  processingStatusUpdater.info('Calculating attributions to resources');
  const manualAttributionsToResources = getAttributionsToResources(
    normalizedOutputResourcesToAttributions,
  );

  processingStatusUpdater.info('Deserializing attributions');
  const manualAttributions = deserializeAttributions(
    parsedOutputData.manualAttributions,
    externalAttributions,
  );

  processingStatusUpdater.info('Sending data to user interface');
  mainWindow.webContents.send(AllowedFrontendChannels.FileLoaded, {
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
  } satisfies ParsedFileContent);

  processingStatusUpdater.info('Finalizing global state');
  getGlobalBackendState().projectTitle = parsedInputData.metadata.projectTitle;
  getGlobalBackendState().projectId = parsedInputData.metadata.projectId;
}

async function createOutputInOpossumFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
  processingStatusUpdater: ProcessingStatusUpdater,
): Promise<ParsedOpossumOutputFile> {
  processingStatusUpdater.info('Preparing output');
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
  return attributionJSON as ParsedOpossumOutputFile;
}

async function parseOrCreateOutputJsonFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  projectId: string,
  processingStatusUpdater: ProcessingStatusUpdater,
  inputFileMD5Checksum?: string,
): Promise<ParsedOpossumOutputFile> {
  if (!fs.existsSync(filePath)) {
    processingStatusUpdater.info('Preparing output');
    const attributionJSON = createJsonOutputFile(
      externalAttributions,
      resourcesToExternalAttributions,
      projectId,
      inputFileMD5Checksum,
    );
    await writeFile({ path: filePath, content: attributionJSON });
  }

  processingStatusUpdater.info('Parsing output');
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

export async function getMessageBoxForParsingError(
  errorMessage: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Parsing Error',
    message: 'Error parsing the input file.',
    detail: `${errorMessage}\n${text.errorBoundary.outdatedAppVersion}`,
  });
}

export async function getMessageBoxForFileNotFoundError(
  errorMessage: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'File Not Found Error',
    message: 'An error occurred while trying to open the file.',
    detail: `${errorMessage}`,
  });
}

export async function getMessageBoxForUnzipError(
  errorMessage: string,
): Promise<void> {
  await dialog.showMessageBox({
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Unzipping Error',
    message: 'An error occurred while trying to unzip the file.',
    detail: `${errorMessage}`,
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
