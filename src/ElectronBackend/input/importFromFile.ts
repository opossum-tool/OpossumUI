// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  Attributions,
  AttributionsToResources,
  DiscreteConfidence,
  ParsedFileContent,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { getGlobalBackendState } from '../main/globalBackendState';
import {
  cleanNonExistentAttributions,
  cleanNonExistentResolvedExternalAttributions,
  parseFrequentLicenses,
  parseRawAttributions,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
} from './parseInputData';
import {
  InvalidDotOpossumFileError,
  JsonParsingError,
  OpossumOutputFile,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../types/types';
import { BrowserWindow } from 'electron';
import { writeJsonToFile } from '../output/writeJsonToFile';
import { cloneDeep } from 'lodash';
import log from 'electron-log';
import {
  getMessageBoxForInvalidDotOpossumFileError,
  getMessageBoxForParsingError,
} from '../errorHandling/errorHandling';
import { v4 as uuid4 } from 'uuid';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';
import {
  parseInputJsonFile,
  parseOpossumFile,
  parseOutputJsonFile,
} from './parseFile';
import { isOpossumFileFormat } from '../utils/isOpossumFileFormat';
import { writeOutputJsonToOpossumFile } from '../output/writeJsonToOpossumFile';
import { setLoadingState } from '../main/listeners';

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
    log.info(`Starting to read .opossum file ${filePath} ...`);
    const parsingResult = await parseOpossumFile(filePath);
    if (isJsonParsingError(parsingResult)) {
      log.info('Invalid input file.');
      await getMessageBoxForParsingError(parsingResult.message);
      return;
    }
    if (isInvalidDotOpossumFileError(parsingResult)) {
      log.info('Invalid input file.');
      setLoadingState(mainWindow.webContents, false);
      await getMessageBoxForInvalidDotOpossumFileError(
        parsingResult.filesInArchive,
        mainWindow,
      );
      return;
    }
    parsedInputData = parsingResult.input;
    parsedOutputData = parsingResult.output;

    log.info('... Successfully read .opossum file.');
  } else {
    log.info(`Starting to parse input file ${filePath}`);
    const parsingResult = await parseInputJsonFile(filePath);
    if (isJsonParsingError(parsingResult)) {
      log.info('Invalid input file.');
      await getMessageBoxForParsingError(parsingResult.message);
      return;
    }
    parsedInputData = parsingResult;
    log.info('... Successfully parsed input file.');
  }

  const [externalAttributions, inputContainsCriticalExternalAttributions] =
    parseRawAttributions(parsedInputData.externalAttributions);
  const projectId = parsedInputData.metadata.projectId;
  const resourcesToAttributions = parsedInputData.resourcesToAttributions;

  if (parsedOutputData === null) {
    if (isOpossumFileFormat(filePath)) {
      parsedOutputData = await createOutputInOpossumFile(
        filePath,
        externalAttributions,
        resourcesToAttributions,
        projectId,
      );
    } else {
      const outputJsonPath = getFilePathWithAppendix(
        filePath,
        '_attributions.json',
      );
      const inputFileMD5Checksum = getGlobalBackendState().inputFileChecksum;
      parsedOutputData = parseOrCreateOutputJsonFile(
        outputJsonPath,
        externalAttributions,
        resourcesToAttributions,
        projectId,
        inputFileMD5Checksum,
      );
    }
  }

  const [manualAttributions] = parseRawAttributions(
    parsedOutputData.manualAttributions,
  );

  log.info('Parsing frequent licenses from input');
  const frequentLicenses = parseFrequentLicenses(
    parsedInputData.frequentLicenses,
  );

  log.info('Sanitizing external resources to attributions');
  const resourcesToExternalAttributions = sanitizeResourcesToAttributions(
    parsedInputData.resources,
    parsedInputData.resourcesToAttributions,
  );
  log.info('Converting and cleaning data');
  const parsedFileContent: ParsedFileContent = {
    metadata: parsedInputData.metadata,
    resources: parsedInputData.resources,
    manualAttributions: {
      attributions: manualAttributions,
      // For a time, a bug in the app produced corrupt files,
      // which are fixed by this clean-up.
      resourcesToAttributions: cleanNonExistentAttributions(
        mainWindow.webContents,
        parsedOutputData.resourcesToAttributions ?? {},
        manualAttributions,
      ),
    },
    externalAttributions: {
      attributions: externalAttributions,
      resourcesToAttributions: resourcesToExternalAttributions,
    },
    frequentLicenses,
    resolvedExternalAttributions: cleanNonExistentResolvedExternalAttributions(
      mainWindow.webContents,
      parsedOutputData.resolvedExternalAttributions,
      externalAttributions,
    ),
    attributionBreakpoints: new Set(
      parsedInputData.attributionBreakpoints ?? [],
    ),
    filesWithChildren: new Set(parsedInputData.filesWithChildren ?? []),
    baseUrlsForSources: sanitizeRawBaseUrlsForSources(
      parsedInputData.baseUrlsForSources,
    ),
    externalAttributionSources:
      parsedInputData.externalAttributionSources ?? {},
  };
  log.info('Sending data to electron frontend');
  mainWindow.webContents.send(
    AllowedFrontendChannels.FileLoaded,
    parsedFileContent,
  );

  log.info('Updating global backend state');

  getGlobalBackendState().projectTitle = parsedInputData.metadata.projectTitle;
  getGlobalBackendState().projectId = projectId;
  getGlobalBackendState().inputContainsCriticalExternalAttributions =
    inputContainsCriticalExternalAttributions;

  log.info('File import finished successfully');
}

async function createOutputInOpossumFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: AttributionsToResources,
  projectId: string,
): Promise<ParsedOpossumOutputFile> {
  log.info(
    `Starting to create output in .opossum file, project ID is ${projectId}`,
  );

  const attributionJSON = createJsonOutputFile(
    externalAttributions,
    resourcesToExternalAttributions,
    projectId,
  );
  await writeOutputJsonToOpossumFile(filePath, attributionJSON);
  log.info('... Successfully wrote output in .opossum file.');

  log.info(`Starting to parse output file in ${filePath} ...`);
  const parsingResult = (await parseOpossumFile(
    filePath,
  )) as ParsedOpossumInputAndOutput;
  const parsedOutputFile = parsingResult.output as ParsedOpossumOutputFile;
  log.info('... Successfully parsed output file.');
  return parsedOutputFile;
}

function parseOrCreateOutputJsonFile(
  filePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: AttributionsToResources,
  projectId: string,
  inputFileMD5Checksum?: string,
): ParsedOpossumOutputFile {
  if (!fs.existsSync(filePath)) {
    log.info(`Starting to create output file, project ID is ${projectId}`);
    const attributionJSON = createJsonOutputFile(
      externalAttributions,
      resourcesToExternalAttributions,
      projectId,
      inputFileMD5Checksum,
    );
    writeJsonToFile(filePath, attributionJSON);
    log.info('... Successfully created output file.');
  }

  log.info(`Starting to parse output file ${filePath} ...`);
  const parsedOutputFile = parseOutputJsonFile(filePath);
  log.info('... Successfully parsed output file.');
  return parsedOutputFile;
}

function createJsonOutputFile(
  externalAttributions: Attributions,
  resourcesToExternalAttributions: AttributionsToResources,
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
      if (packageInfo.attributionConfidence !== undefined) {
        packageInfo.attributionConfidence =
          packageInfo.attributionConfidence >= DiscreteConfidence.High
            ? DiscreteConfidence.High
            : DiscreteConfidence.Low;
      }

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
    manualAttributions,
    resourcesToAttributions,
    resolvedExternalAttributions: [],
  };
}
