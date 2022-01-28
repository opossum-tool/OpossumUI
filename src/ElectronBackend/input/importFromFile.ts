// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';
import upath from 'upath';
import { IpcChannel } from '../../shared/ipc-channels';
import {
  Attributions,
  AttributionsToResources,
  ParsedFileContent,
} from '../../shared/shared-types';
import { setGlobalBackendState } from '../main/globalBackendState';
import {
  cleanNonExistentAttributions,
  cleanNonExistentResolvedExternalSignals,
  parseFrequentLicenses,
  removeHintIfSignalsExist,
  sanitizeRawAttributions,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
} from './cleanInputData';
import { parseOpossumInputFile, parseOpossumOutputFile } from './parseFile';
import {
  GlobalBackendState,
  JsonParsingError,
  OpossumOutputFile,
  ParsedOpossumInputFile,
} from '../types/types';
import { WebContents } from 'electron';
import { writeJsonToFile } from '../output/writeJsonToFile';
import { cloneDeep } from 'lodash';
import log from 'electron-log';
import { getMessageBoxForParsingError } from '../errorHandling/errorHandling';
import { combineExternalAttributionSources } from './externalAttributionSources';
import { ATTRIBUTION_SOURCES } from '../../shared/shared-constants';
import { v4 as uuid4 } from 'uuid';

function isJsonParsingError(
  object: ParsedOpossumInputFile | JsonParsingError
): object is JsonParsingError {
  return (object as JsonParsingError).type === 'jsonParsingError';
}

export async function loadJsonFromFilePath(
  webContents: WebContents,
  filePath: string
): Promise<void> {
  webContents.send(IpcChannel.ResetLoadedFile, {
    resetState: true,
  });

  log.info(`Starting to parse input file ${filePath}`);
  const parsingResult = await parseOpossumInputFile(filePath);

  if (isJsonParsingError(parsingResult)) {
    log.info('Invalid input file.');
    await getMessageBoxForParsingError(parsingResult.message, webContents);

    return;
  }

  log.info('Successfully parsed input file.');
  const externalAttributions = sanitizeRawAttributions(
    parsingResult.externalAttributions
  );

  const manualAttributionFilePath = getFilePathWithAppendix(
    filePath,
    '_attributions.json'
  );
  const projectId = parsingResult.metadata.projectId;

  log.info(
    `Creating output file if it does not exist, project ID is ${projectId}`
  );
  createOutputFileIfItDoesNotExist(
    manualAttributionFilePath,
    externalAttributions,
    parsingResult.resourcesToAttributions,
    projectId
  );

  log.info(`Starting to parse output file ${manualAttributionFilePath} ...`);
  const opossumOutputData = parseOpossumOutputFile(manualAttributionFilePath);
  const manualAttributions = sanitizeRawAttributions(
    opossumOutputData.manualAttributions
  );
  log.info('... Successfully parsed output file.');

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
  // Hints are now a special kind of external attribution,
  // and will be supported in a less hacky way in the near future.
  removeHintIfSignalsExist(
    resourcesToExternalAttributions,
    externalAttributions
  );
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
    resolvedExternalAttributions: cleanNonExistentResolvedExternalSignals(
      webContents,
      opossumOutputData.resolvedExternalAttributions,
      externalAttributions
    ),
    attributionBreakpoints: new Set(parsingResult.attributionBreakpoints ?? []),
    filesWithChildren: new Set(parsingResult.filesWithChildren ?? []),
    baseUrlsForSources: sanitizeRawBaseUrlsForSources(
      parsingResult.baseUrlsForSources
    ),
    externalAttributionSources: combineExternalAttributionSources([
      parsingResult.externalAttributionSources ?? {},
      ATTRIBUTION_SOURCES,
    ]),
  };
  log.info('Sending data to electron frontend');
  webContents.send(IpcChannel.FileLoaded, parsedFileContent);

  log.info('Updating global backend state');
  const newGlobalBackendState: GlobalBackendState = {
    projectId,
    resourceFilePath: filePath,
    attributionFilePath: manualAttributionFilePath,
    followUpFilePath: getFilePathWithAppendix(filePath, '_follow_up.csv'),
    compactBomFilePath: getFilePathWithAppendix(
      filePath,
      '_compact_component_list.csv'
    ),
    detailedBomFilePath: getFilePathWithAppendix(
      filePath,
      '_detailed_component_list.csv'
    ),
    spdxYamlFilePath: getFilePathWithAppendix(filePath, '.spdx.yaml'),
    spdxJsonFilePath: getFilePathWithAppendix(filePath, '.spdx.json'),
    projectTitle: parsingResult.metadata.projectTitle,
  };
  setGlobalBackendState(newGlobalBackendState);

  log.info('File import finished successfully');
}

function createOutputFileIfItDoesNotExist(
  manualAttributionFilePath: string,
  externalAttributions: Attributions,
  resourcesToExternalAttributions: AttributionsToResources,
  projectId: string
): void {
  if (!fs.existsSync(manualAttributionFilePath)) {
    const externalAttributionsCopy = cloneDeep(externalAttributions);
    const preselectedExternalAttributions = Object.fromEntries(
      Object.entries(externalAttributionsCopy).filter(([, packageInfo]) => {
        delete packageInfo.source;
        return Boolean(packageInfo.preSelected);
      })
    );
    const preselectedAttributionIdsToExternalAttributionIds =
      Object.fromEntries(
        Object.keys(preselectedExternalAttributions).map((attributionId) => [
          attributionId,
          uuid4(),
        ])
      );
    const preselectedAttributionsToResources = Object.fromEntries(
      Object.entries(resourcesToExternalAttributions).map(
        ([resourceId, attributionIds]) => {
          const filteredAttributionIds = attributionIds.filter(
            (attributionId) =>
              Object.keys(preselectedExternalAttributions).includes(
                attributionId
              )
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

    const attributionJSON: OpossumOutputFile = {
      metadata: {
        projectId,
        fileCreationDate: String(Date.now()),
      },
      manualAttributions: preselectedAttributions,
      resourcesToAttributions: preselectedAttributionsToResources,
      resolvedExternalAttributions: [],
    };

    writeJsonToFile(manualAttributionFilePath, attributionJSON);
  }
}

function getFilePathWithAppendix(
  resourceFilePath: fs.PathLike,
  appendix: string
): string {
  const { baseFileName, basePath } = getBasePaths(resourceFilePath);

  const fileNameWithAppendix = baseFileName.concat(appendix);
  return basePath.concat(fileNameWithAppendix);
}

function getBasePaths(resourceFilePath: string | Buffer | URL): {
  baseFileName: string;
  basePath: string;
} {
  const baseFileName: string = path.basename(
    resourceFilePath.toString(),
    getFileExtension(resourceFilePath)
  );
  const parent_folder = path.dirname(resourceFilePath.toString());
  const basePath = path.join(upath.toUnix(parent_folder), '/');
  return { baseFileName, basePath };
}

function getFileExtension(resourceFilePath: string | Buffer | URL): string {
  const gzipFileExtension = '.gz';
  const fileIsGziped =
    path.extname(resourceFilePath.toString()) === gzipFileExtension;

  return fileIsGziped
    ? path.extname(
        path.basename(resourceFilePath.toString(), gzipFileExtension)
      ) + gzipFileExtension
    : path.extname(resourceFilePath.toString());
}
