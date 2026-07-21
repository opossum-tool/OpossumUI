// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuid4 } from 'uuid';

import type { ReadonlyRule, SplitInfo } from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import {
  INPUT_FILE_NAME,
  OPOSSUM_FILE_EXTENSION,
} from '../../shared/write-file-utils';

interface SplitOpossumArchivePaths {
  opossumFilePath: string;
  overwriteExistingDestination?: boolean;
  selectedFolderPaths: Array<string>;
  selectedPartitionPath: string;
}

interface SplitOpossumFileResult {
  splitId: string;
  selectedFolderPaths: Array<string>;
  selectedPartitionPath: string;
}

export interface SplitOpossumArchiveArgs extends SplitOpossumArchivePaths {
  sourceZip: AdmZip;
  splitInfo: SplitInfo | null;
}

export interface SplitOpossumArchiveResult extends SplitOpossumFileResult {
  complementSplitInfo: SplitInfo;
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
  opossumFilePath,
  overwriteExistingDestination = false,
  selectedFolderPaths,
  selectedPartitionPath,
  sourceZip,
  splitInfo: existingSplitInfo,
}: SplitOpossumArchiveArgs): Promise<SplitOpossumArchiveResult> {
  validateDestinationPath({
    opossumFilePath,
    overwriteExistingDestination,
    selectedPartitionPath,
  });

  const inputBytes = sourceZip.getEntry(INPUT_FILE_NAME)?.getData();
  if (!inputBytes) {
    throw new Error('Loaded .opossum archive does not contain input.json');
  }

  const inputSha256 = createHash('sha256').update(inputBytes).digest('hex');
  if (
    existingSplitInfo?.inputSha256 !== undefined &&
    existingSplitInfo.inputSha256 !== inputSha256
  ) {
    throw new Error('Loaded split metadata does not match input.json');
  }

  const { complementSplitInfo, selectedSplitInfo } = createSplitInfos(
    existingSplitInfo?.splitId,
    existingSplitInfo?.readonlyRules,
    inputSha256,
    selectedFolderPaths,
  );

  const sourcePartitionZip = new AdmZip(sourceZip.toBuffer());
  const selectedPartitionZip = new AdmZip(sourceZip.toBuffer());
  await writeSplitArchives({
    sourcePath: opossumFilePath,
    selectedPartitionPath,
    sourceZip: sourcePartitionZip,
    selectedPartitionZip,
    complementSplitInfo,
    selectedSplitInfo,
  });

  return {
    splitId: selectedSplitInfo.splitId,
    selectedFolderPaths,
    selectedPartitionPath,
    complementSplitInfo,
  };
}

function validateDestinationPath({
  opossumFilePath,
  overwriteExistingDestination,
  selectedPartitionPath,
}: Pick<
  SplitOpossumArchivePaths,
  'opossumFilePath' | 'overwriteExistingDestination' | 'selectedPartitionPath'
>): void {
  const resolvedSelectedPartitionPath = path.resolve(selectedPartitionPath);
  if (resolvedSelectedPartitionPath === path.resolve(opossumFilePath)) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination file must differ from the currently open .opossum file',
    );
  }
  if (path.extname(resolvedSelectedPartitionPath) !== OPOSSUM_FILE_EXTENSION) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination file must use the .opossum extension',
    );
  }
  if (!fs.existsSync(path.dirname(resolvedSelectedPartitionPath))) {
    throw new SplitOpossumFileError(
      'invalid-destination',
      'Destination directory does not exist',
    );
  }
  if (
    fs.existsSync(resolvedSelectedPartitionPath) &&
    !overwriteExistingDestination
  ) {
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

function createSplitInfos(
  existingSplitId: string | undefined,
  existingReadonlyRules: ReadonlyRule[] | undefined,
  inputSha256: string,
  selectedPaths: Array<string>,
): { complementSplitInfo: SplitInfo; selectedSplitInfo: SplitInfo } {
  const currentReadonlyRules = existingReadonlyRules ?? [];
  const splitId = existingSplitId ?? uuid4();
  return {
    complementSplitInfo: {
      splitId,
      inputSha256,
      readonlyRules: createReadonlyRules(
        currentReadonlyRules,
        selectedPaths,
        'complement',
      ),
    },
    selectedSplitInfo: {
      splitId,
      inputSha256,
      readonlyRules: createReadonlyRules(
        currentReadonlyRules,
        selectedPaths,
        'selected',
      ),
    },
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
  selectedPartitionPath,
  sourceZip,
  selectedPartitionZip,
  complementSplitInfo,
  selectedSplitInfo,
}: {
  complementSplitInfo: SplitInfo;
  selectedSplitInfo: SplitInfo;
  sourcePath: string;
  selectedPartitionPath: string;
  sourceZip: AdmZip;
  selectedPartitionZip: AdmZip;
}): Promise<void> {
  await writeOpossumFile({
    path: selectedPartitionPath,
    zip: selectedPartitionZip,
    splitInfo: selectedSplitInfo,
  });
  await writeOpossumFile({
    path: sourcePath,
    zip: sourceZip,
    splitInfo: complementSplitInfo,
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
