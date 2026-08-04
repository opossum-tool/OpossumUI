// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

import type { ReadonlyRule } from '../../shared/shared-types';

export class MergeReadonlyRulesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MergeReadonlyRulesError';
  }
}

export function getReadonlyRuleMap(
  readonlyRules: Array<ReadonlyRule>,
): Map<string, boolean> {
  return new Map(readonlyRules.map((rule) => [rule.path, rule.readonly]));
}

export function getReadonlyState(
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

export function createSplitRules(
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

export function mergeReadonlyRules(
  rulesByPathByArchive: Array<Map<string, boolean>>,
): Array<ReadonlyRule> {
  if (rulesByPathByArchive.length === 0) {
    throw new MergeReadonlyRulesError('At least one archive is required');
  }
  if (rulesByPathByArchive.some((rulesByPath) => rulesByPath.size === 0)) {
    throw new MergeReadonlyRulesError(
      'All archives must contain readonly rules',
    );
  }
  const candidatePaths = Array.from(
    new Set([
      '/',
      ...rulesByPathByArchive.flatMap((rulesByPath) =>
        Array.from(rulesByPath.keys()),
      ),
    ]),
  );

  const mergedRules: Array<ReadonlyRule> = [];
  for (const resourcePath of candidatePaths) {
    const readonly = getMergedReadonlyState(resourcePath, rulesByPathByArchive);
    const parentReadonly =
      resourcePath === '/'
        ? false
        : getMergedReadonlyState(
            path.posix.dirname(resourcePath),
            rulesByPathByArchive,
          );
    if (readonly !== parentReadonly) {
      mergedRules.push({ path: resourcePath, readonly });
    }
  }

  return mergedRules.sort((first, second) =>
    first.path.localeCompare(second.path),
  );
}

function getMergedReadonlyState(
  resourcePath: string,
  rulesByPathByArchive: Array<Map<string, boolean>>,
): boolean {
  const editableArchiveCount = rulesByPathByArchive.filter(
    (rulesByPath) => !getReadonlyState(resourcePath, rulesByPath),
  ).length;
  if (editableArchiveCount > 1) {
    throw new MergeReadonlyRulesError(
      `Input archives overlap on editable path '${resourcePath}'`,
    );
  }
  return editableArchiveCount === 0;
}

export function isDescendant(
  resourcePath: string,
  ancestorPath: string,
): boolean {
  return resourcePath.startsWith(`${ancestorPath}/`);
}
