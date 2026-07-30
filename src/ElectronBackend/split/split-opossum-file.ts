// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

import type { ReadonlyRule } from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import {
  INPUT_FILE_NAME,
  OPOSSUM_FILE_EXTENSION,
} from '../../shared/write-file-utils';
import { getDb } from '../db/db';

interface SplitOpossumArchivePaths {
  sourceOpossumFilePath: string;
  selectedFolderPaths: Array<string>;
  splitOpossumFilePath: string;
}

export interface SplitOpossumArchiveArgs {
  sourceZip: AdmZip;
  readonlyRules: Array<ReadonlyRule>;
  paths: SplitOpossumArchivePaths;
}

export interface SplitOpossumArchiveResult {
  selectedFolderPaths: Array<string>;
  splitOpossumFilePath: string;
  sourceReadonlyRules: Array<ReadonlyRule>;
}

export type SplitOpossumFileErrorCode =
  'invalid-selection' | 'invalid-destination';

export class SplitOpossumFileError extends Error {
  constructor(
    readonly code: SplitOpossumFileErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SplitOpossumFileError';
  }
}

export async function splitOpossumArchive({
  paths,
  sourceZip,
  readonlyRules: existingReadonlyRules,
}: SplitOpossumArchiveArgs): Promise<SplitOpossumArchiveResult> {
  validateDestinationPath(
    paths.splitOpossumFilePath,
    paths.sourceOpossumFilePath,
  );

  if (!sourceZip.getEntry(INPUT_FILE_NAME)) {
    throw new Error('Loaded .opossum archive does not contain input.json');
  }

  const { sourceReadonlyRules, splitReadonlyRules } = createSplitRules(
    existingReadonlyRules,
    paths.selectedFolderPaths,
  );

  await writeSplitArchives({
    sourcePath: paths.sourceOpossumFilePath,
    splitOpossumFilePath: paths.splitOpossumFilePath,
    sourceZip: new AdmZip(sourceZip.toBuffer()),
    splitZip: new AdmZip(sourceZip.toBuffer()),
    sourceReadonlyRules,
    splitReadonlyRules,
  });

  return {
    selectedFolderPaths: paths.selectedFolderPaths,
    splitOpossumFilePath: paths.splitOpossumFilePath,
    sourceReadonlyRules,
  };
}

function validateDestinationPath(
  splitOpossumFilePath: string,
  opossumFilePath: string,
): void {
  const resolvedSplitOpossumFilePath = path.resolve(splitOpossumFilePath);
  if (resolvedSplitOpossumFilePath === path.resolve(opossumFilePath)) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination file must differ from the currently open .opossum file',
    );
  }
  if (path.extname(resolvedSplitOpossumFilePath) !== OPOSSUM_FILE_EXTENSION) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination file must use the .opossum extension',
    );
  }
  if (!fs.existsSync(path.dirname(resolvedSplitOpossumFilePath))) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination directory does not exist',
    );
  }
}

async function validateResourcesExist(paths: string[]) {
  const selectedResources = await getDb()
    .selectFrom('resource')
    .select('path')
    .where('path', 'in', paths)
    .execute();
  const selectedResourcePathsInDatabase = new Set(
    selectedResources.map((resource) => resource.path),
  );
  for (const selectedFolderPath of paths) {
    if (!selectedResourcePathsInDatabase.has(selectedFolderPath)) {
      throw new Error(
        `Selected resource '${selectedFolderPath}' does not exist`,
      );
    }
  }
}

export async function validateSelectedFolderPaths(
  selectedFolderPaths: Array<string>,
  readonlyRules: Array<ReadonlyRule>,
) {
  if (selectedFolderPaths.length === 0) {
    throw new SplitOpossumFileError(
      'invalid-selection',
      'Select at least one writable folder',
    );
  }
  if (selectedFolderPaths.length !== new Set(selectedFolderPaths).size) {
    throw new SplitOpossumFileError(
      'invalid-selection',
      'Selected folders must be unique',
    );
  }

  const rulesByPath = new Map(
    readonlyRules.map((rule) => [rule.path, rule.readonly]),
  );
  for (const selectedPath of selectedFolderPaths) {
    if (!isCanonicalNonRootPath(selectedPath)) {
      throw new SplitOpossumFileError(
        'invalid-selection',
        `'${selectedPath}' is not a valid folder path`,
      );
    }
    if (getReadonlyState(selectedPath, rulesByPath)) {
      throw new SplitOpossumFileError(
        'invalid-selection',
        `'${selectedPath}' is readonly`,
      );
    }
  }

  if (
    selectedFolderPaths.some((path) =>
      selectedFolderPaths.some((otherPath) => isDescendant(path, otherPath)),
    )
  ) {
    throw new SplitOpossumFileError(
      'invalid-selection',
      'Selected folders must be non-overlapping',
    );
  }

  await validateResourcesExist(selectedFolderPaths);
}

function createSplitRules(
  existingReadonlyRules: Array<ReadonlyRule>,
  selectedPaths: Array<string>,
): {
  sourceReadonlyRules: Array<ReadonlyRule>;
  splitReadonlyRules: Array<ReadonlyRule>;
} {
  return {
    sourceReadonlyRules: createSourceReadonlyRules(
      existingReadonlyRules,
      selectedPaths,
    ),
    splitReadonlyRules: createSplitReadonlyRules(
      existingReadonlyRules,
      selectedPaths,
    ),
  };
}

function createSplitReadonlyRules(
  currentReadonlyRules: Array<ReadonlyRule>,
  selectedPaths: Array<string>,
): Array<ReadonlyRule> {
  return [
    { path: '/', readonly: true },
    ...selectedPaths.map((path) => ({ path, readonly: false })),
    ...currentReadonlyRules.filter((rule) =>
      selectedPaths.some((selectedPath) =>
        isDescendant(rule.path, selectedPath),
      ),
    ),
  ];
}

function createSourceReadonlyRules(
  currentReadonlyRules: Array<ReadonlyRule>,
  selectedPaths: Array<string>,
): Array<ReadonlyRule> {
  const selectedPathsWithCurrentRule = selectedPaths.filter((selectedPath) =>
    currentReadonlyRules.some((rule) => rule.path === selectedPath),
  );

  return [
    ...currentReadonlyRules,
    ...selectedPaths.map((path) => ({ path, readonly: true })),
  ].filter(
    (rule) =>
      !selectedPathsWithCurrentRule.includes(rule.path) &&
      !selectedPaths.some((selectedPath) =>
        isDescendant(rule.path, selectedPath),
      ),
  );
}

function getReadonlyState(
  resourcePath: string,
  rulesByPath: Map<string, boolean>,
): boolean {
  let currentPath = resourcePath;
  while (true) {
    const readonly = rulesByPath.get(currentPath);
    if (readonly !== undefined) {
      return readonly;
    }
    if (currentPath === '/') {
      return false;
    }
    currentPath = path.posix.dirname(currentPath);
  }
}

async function writeSplitArchives({
  sourcePath,
  splitOpossumFilePath,
  sourceZip,
  splitZip,
  sourceReadonlyRules,
  splitReadonlyRules,
}: {
  sourceReadonlyRules: Array<ReadonlyRule>;
  splitReadonlyRules: Array<ReadonlyRule>;
  sourcePath: string;
  splitOpossumFilePath: string;
  sourceZip: AdmZip;
  splitZip: AdmZip;
}): Promise<void> {
  await writeOpossumFile({
    path: splitOpossumFilePath,
    zip: splitZip,
    readonlyRules: splitReadonlyRules,
  });
  await writeOpossumFile({
    path: sourcePath,
    zip: sourceZip,
    readonlyRules: sourceReadonlyRules,
  });
}

function isCanonicalNonRootPath(resourcePath: string): boolean {
  return (
    resourcePath.startsWith('/') &&
    !resourcePath.endsWith('/') &&
    resourcePath !== '/'
  );
}

function isDescendant(path: string, ancestorPath: string): boolean {
  return path.startsWith(`${ancestorPath}/`);
}
