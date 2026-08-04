// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import fs from 'fs';
import { isDeepStrictEqual } from 'node:util';
import path from 'path';

import type { ReadonlyRule } from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import {
  INPUT_FILE_NAME,
  OPOSSUM_FILE_EXTENSION,
  OUTPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from '../../shared/write-file-utils';
import { parseOutputJsonContent, parseReadonlyRules } from '../input/parseFile';
import type { ParsedOpossumOutputFile } from '../types/types';
import {
  getReadonlyRuleMap,
  getReadonlyState,
  mergeReadonlyRules as mergePureReadonlyRules,
  MergeReadonlyRulesError,
} from './readonly-rules';

export interface MergeOpossumArchivesArgs {
  ignoreReadonlyResourceOutputConflicts?: boolean;
  inputPaths: Array<string>;
  outputPath: string;
}

interface MergeArchive {
  output: ParsedOpossumOutputFile;
  readonlyRulesByPath: Map<string, boolean>;
  zip: AdmZip;
}

export class MergeOpossumFilesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MergeOpossumFilesError';
  }
}

export async function mergeOpossumArchives({
  ignoreReadonlyResourceOutputConflicts = false,
  inputPaths,
  outputPath,
}: MergeOpossumArchivesArgs): Promise<void> {
  validatePaths(inputPaths, outputPath);
  const archives = inputPaths.map(readMergeArchive);
  validateProjectIds(archives);

  const readonlyRules = mergeReadonlyRules(archives);
  const output = mergeOutput(archives, ignoreReadonlyResourceOutputConflicts);

  await writeOpossumFile({
    path: outputPath,
    zip: new AdmZip(archives[0].zip.toBuffer()),
    output,
    readonlyRules,
  });
}

function readMergeArchive(filePath: string): MergeArchive {
  let zip: AdmZip;
  try {
    zip = new AdmZip(filePath);
  } catch (error) {
    throw new MergeOpossumFilesError(
      `Cannot merge '${filePath}': ${getErrorMessage(error)}`,
    );
  }

  if (!zip.getEntry(INPUT_FILE_NAME)) {
    throw new MergeOpossumFilesError(
      `Cannot merge '${filePath}': archive does not contain input.json`,
    );
  }
  const outputEntry = zip.getEntry(OUTPUT_FILE_NAME);
  if (!outputEntry) {
    throw new MergeOpossumFilesError(
      `Cannot merge '${filePath}': archive does not contain output.json`,
    );
  }

  try {
    const readonlyRulesEntry = zip.getEntry(SPLIT_INFO_FILE_NAME);
    const readonlyRules = readonlyRulesEntry
      ? parseReadonlyRules(readonlyRulesEntry.getData().toString('utf-8'))
      : [];
    return {
      output: parseOutputJsonContent(
        outputEntry.getData().toString('utf-8'),
        filePath,
      ),
      readonlyRulesByPath: getReadonlyRuleMap(readonlyRules),
      zip,
    };
  } catch (error) {
    throw new MergeOpossumFilesError(
      `Cannot merge '${filePath}': ${getErrorMessage(error)}`,
    );
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validatePaths(inputPaths: Array<string>, outputPath: string): void {
  if (inputPaths.length < 2) {
    throw new MergeOpossumFilesError('Select at least two .opossum archives');
  }
  const resolvedInputPaths = inputPaths.map((inputPath) =>
    path.resolve(inputPath),
  );
  if (new Set(resolvedInputPaths).size !== inputPaths.length) {
    throw new MergeOpossumFilesError('Input archives must be unique');
  }
  if (path.extname(outputPath) !== OPOSSUM_FILE_EXTENSION) {
    throw new MergeOpossumFilesError(
      'Output archive must use the .opossum extension',
    );
  }
  if (!fs.existsSync(path.dirname(path.resolve(outputPath)))) {
    throw new MergeOpossumFilesError('Output directory does not exist');
  }
}

function validateProjectIds(archives: Array<MergeArchive>): void {
  const projectId = archives[0].output.metadata.projectId;
  if (
    archives.some((archive) => archive.output.metadata.projectId !== projectId)
  ) {
    throw new MergeOpossumFilesError(
      'All input archives must have the same project ID',
    );
  }
}

function mergeReadonlyRules(
  archives: Array<MergeArchive>,
): Array<ReadonlyRule> {
  try {
    return mergePureReadonlyRules(
      archives.map((archive) => archive.readonlyRulesByPath),
    );
  } catch (error) {
    if (error instanceof MergeReadonlyRulesError) {
      throw new MergeOpossumFilesError(error.message);
    }
    throw error;
  }
}

function mergeOutput(
  archives: Array<MergeArchive>,
  ignoreReadonlyResourceOutputConflicts: boolean,
): ParsedOpossumOutputFile {
  const manualAttributions: ParsedOpossumOutputFile['manualAttributions'] = {};
  const resourcesToAttributions: ParsedOpossumOutputFile['resourcesToAttributions'] =
    {};
  const { outputJsonResourcePaths, referencedAttributionUuids } =
    getOutputJsonResourcePathsAndReferencedAttributionUuids(archives);
  const readonlyResourceOutputConflicts: Array<string> = [];

  for (const outputJsonResourcePath of outputJsonResourcePaths) {
    const editableArchive = findEditableArchive(
      getResourcePath(outputJsonResourcePath),
      archives,
    );
    if (
      !ignoreReadonlyResourceOutputConflicts &&
      !editableArchive &&
      !hasEqualReadonlyResourceOutput(outputJsonResourcePath, archives)
    ) {
      readonlyResourceOutputConflicts.push(outputJsonResourcePath);
    }
    const outputArchive = editableArchive ?? archives[0];
    const attributionUuids =
      outputArchive.output.resourcesToAttributions[outputJsonResourcePath];
    if (!attributionUuids) {
      continue;
    }
    resourcesToAttributions[outputJsonResourcePath] = attributionUuids;
    for (const attributionUuid of attributionUuids) {
      const attribution =
        outputArchive.output.manualAttributions[attributionUuid];
      if (attribution) {
        manualAttributions[attributionUuid] = attribution;
      }
    }
  }

  // We don't expect unlinked attributions to occur, but the data model does not prevent it.
  // We have no way of resolving conflicts between them, so we simply choose one archive as the authority.
  const rootEditableArchive = findEditableArchive('/', archives);
  const unlinkedAttributionSourceArchive = rootEditableArchive ?? archives[0];
  for (const [attributionUuid, attribution] of Object.entries(
    unlinkedAttributionSourceArchive.output.manualAttributions,
  )) {
    if (!referencedAttributionUuids.has(attributionUuid)) {
      manualAttributions[attributionUuid] = attribution;
    }
  }

  if (readonlyResourceOutputConflicts.length > 0) {
    throw new MergeOpossumFilesError(
      `Input archives disagree on readonly resource output for paths: ${readonlyResourceOutputConflicts.map((path) => `'${path}'`).join(', ')}`,
    );
  }

  return {
    ...archives[0].output,
    manualAttributions,
    resourcesToAttributions,
    resolvedExternalAttributions: Array.from(
      new Set(
        archives.flatMap(
          (archive) => archive.output.resolvedExternalAttributions ?? [],
        ),
      ),
    ),
  };
}

function hasEqualReadonlyResourceOutput(
  outputJsonResourcePath: string,
  archives: Array<MergeArchive>,
): boolean {
  const [firstArchive, ...otherArchives] = archives;
  const attributionUuids =
    firstArchive.output.resourcesToAttributions[outputJsonResourcePath];

  for (const archive of otherArchives) {
    if (
      !isDeepStrictEqual(
        archive.output.resourcesToAttributions[outputJsonResourcePath],
        attributionUuids,
      )
    ) {
      return false;
    }
    for (const attributionUuid of attributionUuids ?? []) {
      if (
        !isDeepStrictEqual(
          archive.output.manualAttributions[attributionUuid],
          firstArchive.output.manualAttributions[attributionUuid],
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

function findEditableArchive(
  resourcePath: string,
  archives: Array<MergeArchive>,
): MergeArchive | undefined {
  return archives.find(
    (archive) => !getReadonlyState(resourcePath, archive.readonlyRulesByPath),
  );
}

function getResourcePath(outputJsonResourcePath: string): string {
  if (outputJsonResourcePath === '/') {
    return outputJsonResourcePath;
  }
  return outputJsonResourcePath.replace(/\/$/, '');
}

function getOutputJsonResourcePathsAndReferencedAttributionUuids(
  archives: Array<MergeArchive>,
): {
  outputJsonResourcePaths: Set<string>;
  referencedAttributionUuids: Set<string>;
} {
  const outputJsonResourcePaths = new Set<string>();
  const referencedAttributionUuids = new Set<string>();

  for (const archive of archives) {
    for (const [outputJsonResourcePath, attributionUuids] of Object.entries(
      archive.output.resourcesToAttributions,
    )) {
      outputJsonResourcePaths.add(outputJsonResourcePath);
      for (const attributionUuid of attributionUuids) {
        referencedAttributionUuids.add(attributionUuid);
      }
    }
  }

  return { outputJsonResourcePaths, referencedAttributionUuids };
}
