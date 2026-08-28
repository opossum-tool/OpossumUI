// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionPageRequest,
  AttributionRelationCountRequest,
} from '../../../../shared/attribution-result-set';
import { Criticality } from '../../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../../testing/global-test-helpers';
import { listAttributionRelationCounts } from '../attribution-relation-counts';
import {
  listAttributionPreview,
  listAttributionsPage,
  locateAttribution,
} from '../listAttributionsPage';

export const defaultCriteria = {
  external: false,
  filters: [],
  search: '',
  valueFilters: {},
  resourcePathForRelationships: '',
  showResolved: false,
  excludeUnrelated: false,
} satisfies AttributionRelationCountRequest;

export async function initializeDefaultAttributionQueryTestData(): Promise<void> {
  await initializeDbWithTestData({
    resources: pathsToResources(['/parent', '/parent/resource', '/other']),
    manualAttributions: {
      attributions: {
        resourceOne: {
          id: 'resourceOne',
          criticality: Criticality.None,
          packageName: 'resourceOne',
        },
        resourceTwo: {
          id: 'resourceTwo',
          criticality: Criticality.None,
          packageName: 'resourceTwo',
        },
        child: { id: 'child', criticality: Criticality.None },
        parent: { id: 'parent', criticality: Criticality.None },
        unrelated: { id: 'unrelated', criticality: Criticality.None },
      },
      resourcesToAttributions: {
        '/parent/resource': ['resourceOne', 'resourceTwo'],
        '/parent': ['parent'],
        '/other': ['resourceTwo', 'unrelated'],
      },
      attributionsToResources: {},
    },
  });
}

export const listPage = (props: Partial<AttributionPageRequest>) =>
  listAttributionsPage({
    ...defaultCriteria,
    scope: { mode: 'relation', relation: 'resource' },
    sort: 'alphabetically',
    includeReadonly: false,
    offset: 0,
    limit: 200,
    ...props,
  });

export const allPage = (props: Partial<AttributionPageRequest>) =>
  listAttributionsPage({
    ...defaultCriteria,
    scope: { mode: 'all' },
    sort: 'alphabetically',
    includeReadonly: false,
    offset: 0,
    limit: 200,
    ...props,
  });

export const relationCounts = (
  props: Partial<AttributionRelationCountRequest>,
) => listAttributionRelationCounts({ ...defaultCriteria, ...props });

export const preview = (
  props: Partial<Parameters<typeof listAttributionPreview>[0]>,
) =>
  listAttributionPreview({
    ...defaultCriteria,
    relation: 'resource',
    excludedAttributionUuids: [],
    offset: 0,
    limit: 200,
    ...props,
  });

export const locate = (
  props: Partial<Parameters<typeof locateAttribution>[0]>,
) =>
  locateAttribution({
    ...defaultCriteria,
    sort: 'alphabetically',
    includeReadonly: false,
    targetAttributionUuid: 'target',
    limit: 200,
    navigationScope: 'targetRelation',
    ...props,
  });
