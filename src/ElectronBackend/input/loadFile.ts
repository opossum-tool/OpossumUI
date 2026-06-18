// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';
import { cloneDeep } from 'lodash-es';
import { v4 as uuid4 } from 'uuid';

import type {
  Attributions,
  ParsedFileContent,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { OUTPUT_FILE_NAME } from '../../shared/write-file-utils';
import { saveFile } from '../api/saveFile';
import { initializeDb } from '../db/initializeDb';
import type {
  OpossumOutputFile,
  ParsedOpossumOutputFile,
  ParsingError,
} from '../types/types';
import type { LoadedArchive } from './parseFile';
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
  opossumZip: AdmZip;
  projectTitle?: string;
  projectId: string;
}

interface LoadFileError {
  ok: false;
  error: ParsingError;
}

type LoadFileResult = LoadFileSuccess | LoadFileError;

export type LoadFileIpcResult =
  | Omit<LoadFileSuccess, 'opossumZip'>
  | LoadFileError;

export interface LoadFileGlobalState {
  inputFileChecksum?: string;
}

export type LoadFileProgressCallback = (
  message: string,
  level?: 'info' | 'warn',
) => void;

export async function loadFile(
  opossumFilePath: string,
  archive: LoadedArchive,
  globalState: LoadFileGlobalState,
  reportProgress: LoadFileProgressCallback = () => {},
): Promise<LoadFileResult> {
  const {
    input: parsedInputData,
    output: parsedOutputData,
    opossumZip,
  } = archive;

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

  // When no output exists yet we build it in memory, add it to the zip, and
  // persist it via `saveFile` — the same serialization path used by every later
  // save — so freshly-created output stays consistent with saved output (e.g.
  // trailing-slash handling for files-with-children).
  let createdOutputNeedsPersisting = false;
  let resolvedOutputData: ParsedOpossumOutputFile;
  if (parsedOutputData === null) {
    reportProgress('Creating output file');
    resolvedOutputData = createJsonOutputFile(
      externalAttributions,
      resourcesToExternalAttributions,
      parsedInputData.metadata.projectId,
      globalState.inputFileChecksum,
    );
    opossumZip.addFile(
      OUTPUT_FILE_NAME,
      Buffer.from(JSON.stringify(resolvedOutputData), 'utf-8'),
    );
    createdOutputNeedsPersisting = true;
  } else {
    resolvedOutputData = parsedOutputData;
  }

  const filesWithChildrenSet = new Set(
    parsedInputData.filesWithChildren?.map(addTrailingSlashIfAbsent),
  );

  reportProgress('Calculating attributions to resources');
  const manualAttributionsToResources = getAttributionsToResources(
    resolvedOutputData.resourcesToAttributions,
  );

  reportProgress('Deserializing attributions');
  const manualAttributions = deserializeAttributions(
    resolvedOutputData.manualAttributions,
    externalAttributions,
  );

  const parsedFileContent = {
    metadata: parsedInputData.metadata,
    resources: parsedInputData.resources,
    config: configuration,
    manualAttributions: {
      attributions: manualAttributions,
      resourcesToAttributions: resolvedOutputData.resourcesToAttributions,
      attributionsToResources: manualAttributionsToResources,
    },
    externalAttributions: {
      attributions: externalAttributions,
      resourcesToAttributions: resourcesToExternalAttributions,
      attributionsToResources: externalAttributionsToResources,
    },
    frequentLicenses,
    resolvedExternalAttributions: new Set(
      resolvedOutputData.resolvedExternalAttributions,
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
      {
        projectId: parsedInputData.metadata.projectId,
        opossumFilePath,
      },
      opossumZip,
    );
  }

  return {
    ok: true,
    opossumZip,
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
