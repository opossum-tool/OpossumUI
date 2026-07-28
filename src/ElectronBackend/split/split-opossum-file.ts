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

interface SplitOpossumArchivePaths {
  opossumFilePath: string;
  selectedFolderPaths: Array<string>;
  partitionOutputPath: string;
}

export interface SplitOpossumArchiveArgs {
  sourceZip: AdmZip;
  readonlyRules: Array<ReadonlyRule>;
  paths: SplitOpossumArchivePaths;
}

export interface SplitOpossumArchiveResult {
  selectedFolderPaths: Array<string>;
  partitionOutputPath: string;
  complementReadonlyRules: Array<ReadonlyRule>;
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
  validateDestinationPath(paths.partitionOutputPath);

  if (!sourceZip.getEntry(INPUT_FILE_NAME)) {
    throw new Error('Loaded .opossum archive does not contain input.json');
  }

  const { complementReadonlyRules, selectedReadonlyRules } = createSplitRules(
    existingReadonlyRules,
    paths.selectedFolderPaths,
  );

  const sourcePartitionZip = new AdmZip(sourceZip.toBuffer());
  const selectedPartitionZip = new AdmZip(sourceZip.toBuffer());
  await writeSplitArchives({
    sourcePath: paths.opossumFilePath,
    partitionOutputPath: paths.partitionOutputPath,
    sourceZip: sourcePartitionZip,
    selectedPartitionZip,
    complementReadonlyRules,
    selectedReadonlyRules,
  });

  return {
    selectedFolderPaths: paths.selectedFolderPaths,
    partitionOutputPath: paths.partitionOutputPath,
    complementReadonlyRules,
  };
}

function validateDestinationPath(partitionOutputPath: string): void {
  const resolvedPartitionOutputPath = path.resolve(partitionOutputPath);
  if (path.extname(resolvedPartitionOutputPath) !== OPOSSUM_FILE_EXTENSION) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination file must use the .opossum extension',
    );
  }
  if (!fs.existsSync(path.dirname(resolvedPartitionOutputPath))) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination directory does not exist',
    );
  }
  if (fs.existsSync(resolvedPartitionOutputPath)) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination file already exists',
    );
  }
}

export function validateSelectedFolderPaths(
  selectedFolderPaths: Array<string>,
  readonlyRules: Array<ReadonlyRule>,
): Array<string> {
  if (selectedFolderPaths.length === 0) {
    throw new SplitOpossumFileError(
      'invalid-selection',
      'Select at least one writable folder',
    );
  }

  const normalizedPaths = [...selectedFolderPaths].sort();
  const rulesByPath = new Map(
    readonlyRules.map((rule) => [rule.path, rule.readonly]),
  );
  for (let index = 0; index < normalizedPaths.length; index += 1) {
    const selectedPath = normalizedPaths[index];
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
    if (
      index > 0 &&
      (selectedPath === normalizedPaths[index - 1] ||
        isEqualOrDescendant(selectedPath, normalizedPaths[index - 1]))
    ) {
      throw new SplitOpossumFileError(
        'invalid-selection',
        'Selected folders must be unique and non-overlapping',
      );
    }
  }
  return normalizedPaths;
}

function createSplitRules(
  existingReadonlyRules: Array<ReadonlyRule>,
  selectedPaths: Array<string>,
): {
  complementReadonlyRules: Array<ReadonlyRule>;
  selectedReadonlyRules: Array<ReadonlyRule>;
} {
  const currentReadonlyRules = existingReadonlyRules;
  return {
    complementReadonlyRules: createReadonlyRules(
      currentReadonlyRules,
      selectedPaths,
      'complement',
    ),
    selectedReadonlyRules: createReadonlyRules(
      currentReadonlyRules,
      selectedPaths,
      'selected',
    ),
  };
}

function createReadonlyRules(
  currentReadonlyRules: Array<ReadonlyRule>,
  selectedPaths: Array<string>,
  partition: 'selected' | 'complement',
): Array<ReadonlyRule> {
  const rules: Array<ReadonlyRule> = [];
  const currentRulesByPath = new Map(
    currentReadonlyRules.map((rule) => [rule.path, rule.readonly]),
  );
  const rulesByPath = new Map<string, boolean>();
  const boundaryPaths = new Set([
    '/',
    ...currentReadonlyRules.map((rule) => rule.path),
    ...selectedPaths,
  ]);

  for (const resourcePath of [...boundaryPaths].sort()) {
    const currentReadonly = getReadonlyState(resourcePath, currentRulesByPath);
    const isSelected = selectedPaths.some((selectedPath) =>
      isEqualOrDescendant(resourcePath, selectedPath),
    );
    const readonly =
      partition === 'selected'
        ? currentReadonly || !isSelected
        : currentReadonly || isSelected;
    const inheritedReadonly =
      resourcePath === '/'
        ? false
        : getReadonlyState(path.posix.dirname(resourcePath), rulesByPath);

    if (readonly !== inheritedReadonly) {
      rules.push({ path: resourcePath, readonly });
      rulesByPath.set(resourcePath, readonly);
    }
  }
  return rules;
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
  partitionOutputPath,
  sourceZip,
  selectedPartitionZip,
  complementReadonlyRules,
  selectedReadonlyRules,
}: {
  complementReadonlyRules: Array<ReadonlyRule>;
  selectedReadonlyRules: Array<ReadonlyRule>;
  sourcePath: string;
  partitionOutputPath: string;
  sourceZip: AdmZip;
  selectedPartitionZip: AdmZip;
}): Promise<void> {
  await writeOpossumFile({
    path: partitionOutputPath,
    zip: selectedPartitionZip,
    readonlyRules: selectedReadonlyRules,
  });
  await writeOpossumFile({
    path: sourcePath,
    zip: sourceZip,
    readonlyRules: complementReadonlyRules,
  });
}

function isCanonicalNonRootPath(resourcePath: string): boolean {
  return (
    resourcePath.startsWith('/') &&
    !resourcePath.endsWith('/') &&
    resourcePath !== '/'
  );
}

function isEqualOrDescendant(path: string, ancestorPath: string): boolean {
  return path === ancestorPath || path.startsWith(`${ancestorPath}/`);
}
