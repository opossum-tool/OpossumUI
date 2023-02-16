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
} from '../../shared/shared-types';
import { getGlobalBackendState } from '../main/globalBackendState';
import {
  cleanNonExistentAttributions,
  parseFrequentLicenses,
  parseRawAttributions,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
} from './parseInputData';
import {
  parseOpossumInputFile,
  parseOpossumOutputFile,
  readZip,
  writeZip,
} from './parseFile';
import {
  JsonParsingError,
  OpossumOutputFile,
  ParsedOpossumInputFile,
} from '../types/types';
import { WebContents } from 'electron';
import { writeJsonToFile } from '../output/writeJsonToFile';
import { cloneDeep } from 'lodash';
import log from 'electron-log';
import { getMessageBoxForParsingError } from '../errorHandling/errorHandling';
import { v4 as uuid4 } from 'uuid';
import { getFilePathWithAppendix } from '../utils/getFilePathWithAppendix';

function isJsonParsingError(
  object: ParsedOpossumInputFile | JsonParsingError
): object is JsonParsingError {
  return (object as JsonParsingError).type === 'jsonParsingError';
}

export async function loadJsonFromFilePath(
  webContents: WebContents,
  filePath: string
): Promise<void> {
  webContents.send(AllowedFrontendChannels.ResetLoadedFile, {
    resetState: true,
  });
  let zipFilePath;
  if (filePath.endsWith('.zip')) {
    zipFilePath = filePath;
  } else {
    zipFilePath = getFilePathWithAppendix(filePath, '_out.zip');
  }
  let manualAttributions;
  let parsingResult;
  let opossumOutputData;

  if (fs.existsSync(zipFilePath)) {
    log.info(`Starting to read zip file ${zipFilePath} ...`);
    [parsingResult, opossumOutputData] = await readZip(zipFilePath);
    log.info('... Successfully read zip file.\n');
    [manualAttributions] = parseRawAttributions(
      opossumOutputData.manualAttributions
    );
  } else {
    opossumOutputData = {};
    manualAttributions = {};
    log.info(`Starting to parse input file ${filePath}`);
    parsingResult = await parseOpossumInputFile(filePath);
  }

  if (isJsonParsingError(parsingResult)) {
    log.info('Invalid input file.');
    await getMessageBoxForParsingError(parsingResult.message);

    return;
  }

  log.info('... Successfully parsed input file.');
  const [externalAttributions, inputContainsCriticalExternalAttributions] =
    parseRawAttributions(parsingResult.externalAttributions);

  const manualAttributionFilePath = getFilePathWithAppendix(
    filePath,
    '_attributions.json'
  );
  const projectId = parsingResult.metadata.projectId;
  const inputFileChecksum = getGlobalBackendState().inputFileChecksum;

  if (!fs.existsSync(manualAttributionFilePath) && !filePath.endsWith('.zip')) {
    log.info(`Starting to create output file, project ID is ${projectId}`);
    createOutputFile(
      manualAttributionFilePath,
      externalAttributions,
      parsingResult.resourcesToAttributions,
      projectId,
      inputFileChecksum
    );
    log.info('... Successfully created output file.');
  }

  if (!fs.existsSync(zipFilePath)) {
    log.info(`Starting to parse output file ${manualAttributionFilePath} ...`);
    opossumOutputData = parseOpossumOutputFile(manualAttributionFilePath);
    [manualAttributions] = parseRawAttributions(
      opossumOutputData.manualAttributions
    );
    log.info('... Successfully parsed output file.');

    log.info(`Starting to write zip file ${zipFilePath} ...`);
    writeZip(
      zipFilePath,
      JSON.stringify(parsingResult),
      JSON.stringify(opossumOutputData)
    );
    log.info('... Successfully created zip file.');
  }

  log.info('Parsing frequent licenses from input');
  const frequentLicenses = parseFrequentLicenses(
    parsingResult.frequentLicenses
  );

  log.info('Sanitizing external resources to attributions');
  const resourcesToExternalAttributions = sanitizeResourcesToAttributions(
    parsingResult.resources,
    parsingResult.resourcesToAttributions
  );
  log.info('Converting and cleaning data');
  const parsedFileContent: ParsedFileContent = {
    metadata: parsingResult.metadata,
    resources: parsingResult.resources,
    manualAttributions: {
      attributions: manualAttributions,
      // For a time, a bug in the app produced corrupt files,
      // which are fixed by this clean-up.
      resourcesToAttributions: cleanNonExistentAttributions(
        webContents,
        opossumOutputData.resourcesToAttributions,
        manualAttributions
      ),
    },
    externalAttributions: {
      attributions: externalAttributions,
      resourcesToAttributions: resourcesToExternalAttributions,
    },
    frequentLicenses,
    resolvedExternalAttributions: new Set(),
    attributionBreakpoints: new Set(parsingResult.attributionBreakpoints ?? []),
    filesWithChildren: new Set(parsingResult.filesWithChildren ?? []),
    baseUrlsForSources: sanitizeRawBaseUrlsForSources(
      parsingResult.baseUrlsForSources
    ),
    externalAttributionSources: parsingResult.externalAttributionSources ?? {},
  };
  log.info('Sending data to electron frontend');
  webContents.send(AllowedFrontendChannels.FileLoaded, parsedFileContent);

  log.info('Updating global backend state');

  getGlobalBackendState().projectTitle = parsingResult.metadata.projectTitle;
  getGlobalBackendState().projectId = projectId;
  getGlobalBackendState().inputContainsCriticalExternalAttributions =
    inputContainsCriticalExternalAttributions;

  log.info('File import finished successfully');
}

function createOutputFile(
  manualAttributionFilePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: AttributionsToResources,
  projectId: string,
  inputFileMD5Checksum?: string
): void {
  const externalAttributionsCopy = cloneDeep(externalAttributions);
  const preselectedExternalAttributions = Object.fromEntries(
    Object.entries(externalAttributionsCopy).filter(([, packageInfo]) => {
      delete packageInfo.source;
      return Boolean(packageInfo.preSelected);
    })
  );
  const preselectedAttributionIdsToExternalAttributionIds = Object.fromEntries(
    Object.keys(preselectedExternalAttributions).map((attributionId) => [
      attributionId,
      uuid4(),
    ])
  );
  const preselectedAttributionsToResources = Object.fromEntries(
    Object.entries(resourcesToExternalAttributions).map(
      ([resourceId, attributionIds]) => {
        const filteredAttributionIds = attributionIds.filter((attributionId) =>
          Object.keys(preselectedExternalAttributions).includes(attributionId)
        );
        return filteredAttributionIds.length
          ? [
              resourceId,
              filteredAttributionIds.map(
                (attributionId) =>
                  preselectedAttributionIdsToExternalAttributionIds[
                    attributionId
                  ]
              ),
            ]
          : [];
      }
    )
  );
  const preselectedAttributions = Object.fromEntries(
    Object.entries(preselectedExternalAttributions).map(
      ([attributionId, packageInfo]) => [
        preselectedAttributionIdsToExternalAttributionIds[attributionId],
        packageInfo,
      ]
    )
  );

  for (const attributionId of Object.keys(preselectedAttributions)) {
    const attributionConfidence =
      preselectedAttributions[attributionId].attributionConfidence;
    if (attributionConfidence !== undefined) {
      preselectedAttributions[attributionId].attributionConfidence =
        attributionConfidence >= DiscreteConfidence.High
          ? DiscreteConfidence.High
          : DiscreteConfidence.Low;
    }
  }

  const attributionJSON: OpossumOutputFile = {
    metadata: {
      projectId,
      fileCreationDate: String(Date.now()),
      inputFileMD5Checksum,
    },
    manualAttributions: preselectedAttributions,
    resourcesToAttributions: preselectedAttributionsToResources,
    resolvedExternalAttributions: [],
  };

  writeJsonToFile(manualAttributionFilePath, attributionJSON);
}
