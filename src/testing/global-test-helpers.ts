// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ResourceTreeNodeData } from '../ElectronBackend/api/resourceTree';
import { initializeDb } from '../ElectronBackend/db/initializeDb';
import { ParsedFileContent, Resources } from '../shared/shared-types';

export function makeResourceTreeNode(
  overrides: Partial<ResourceTreeNodeData> &
    Pick<ResourceTreeNodeData, 'id'> = { id: '/' },
): ResourceTreeNodeData {
  const pathParts = overrides.id.split('/').filter(Boolean);
  return {
    labelText: overrides.id === '/' ? '/' : pathParts[pathParts.length - 1],
    level: pathParts.length,
    isExpandable: false,
    isExpanded: false,
    hasManualAttribution: false,
    hasExternalAttribution: false,
    hasUnresolvedExternalAttribution: false,
    hasParentWithManualAttribution: false,
    containsExternalAttribution: false,
    containsManualAttribution: false,
    containsResourcesWithOnlyExternalAttribution: false,
    canHaveChildren: false,
    isAttributionBreakpoint: false,
    isFile: true,
    criticality: null,
    classification: null,
    ...overrides,
  };
}

export const ROOT_TREE_NODE: ResourceTreeNodeData = makeResourceTreeNode({
  id: '/',
  level: 0,
  isExpandable: true,
  isExpanded: true,
  canHaveChildren: true,
  isFile: false,
});

export function pathsToResources(paths: Array<string>) {
  const result: Resources = {};
  for (const path of paths) {
    let current = result;
    const names = path.split('/');

    // Ignore empty first string (because all paths start with /)
    // and last name, which is empty for directories
    for (const name of names.slice(1, -1)) {
      if (!(name in current) || current[name] === 1) {
        current[name] = {};
      }
      current = current[name];
    }

    const lastName = names.at(-1);
    if (lastName && lastName !== '') {
      current[lastName] = 1;
    }
  }

  return result;
}

export async function initializeDbWithTestData(
  overrides?: Partial<ParsedFileContent>,
) {
  const emptyFileContent = {
    metadata: { projectId: '', fileCreationDate: '' },
    config: { classifications: {} },
    resources: {},
    manualAttributions: {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
    },
    externalAttributions: {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
    },
    frequentLicenses: { nameOrder: [], texts: {} },
    resolvedExternalAttributions: new Set<string>(),
    attributionBreakpoints: new Set<string>(),
    filesWithChildren: new Set<string>(),
    baseUrlsForSources: {},
    externalAttributionSources: {},
  } satisfies ParsedFileContent;

  await initializeDb({
    ...emptyFileContent,
    ...overrides,
  });
}
