// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  AttributionsToResources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { pathsToResources } from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';
import { initializeDb } from '../../db/initializeDb';
import { removeRedundantAttributions, removeTrailingSlash } from '../utils';

describe('removeRedundantAttributions', () => {
  it.each([
    {
      name: 'upward: deletes resource attributions that match its closest ancestor',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid1'],
      },
      onResourcePath: '/first/second',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
      },
    },

    {
      name: 'upward: keeps resource attributions when they differ from ancestor',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid2'],
      },
      onResourcePath: '/first/second',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid2'],
      },
    },

    {
      name: 'downward: deletes descendant attributions that match the resource',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid1'],
      },
      onResourcePath: '/first',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
      },
    },

    {
      name: 'downward: keeps descendant attributions that differ from the resource',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid2'],
      },
      onResourcePath: '/first',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid2'],
      },
    },

    {
      name: 'deletes both resource and descendant when all three levels match',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid1'],
        '/first/second/third': ['uuid1'],
      },
      onResourcePath: '/first/second',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': [],
      },
    },

    {
      name: 'deletes only matching descendants and keeps non-matching ones',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/child1': ['uuid1'],
        '/first/child2': ['uuid2'],
      },
      onResourcePath: '/first',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/child1': [],
        '/first/child2': ['uuid2'],
      },
    },

    {
      name: 'handles multiple attributions per resource: deletes only when sets match exactly',
      resourcesToAttributions: {
        '/first': ['uuid1', 'uuid2'],
        '/first/child1': ['uuid1', 'uuid2'],
        '/first/child2': ['uuid1'],
      },
      onResourcePath: '/first',
      expectedResourcesToAttributions: {
        '/first': ['uuid1', 'uuid2'],
        '/first/child1': [],
        '/first/child2': ['uuid1'],
      },
    },

    {
      name: 'breakpoint: does not delete resource attributions matching ancestor when breakpoint is in between',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': ['uuid1'],
      },
      attributionBreakpoints: ['/first/second'],
      onResourcePath: '/first/second/third',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': ['uuid1'],
      },
    },

    {
      name: 'breakpoint: does not delete descendant attributions when descendant is a breakpoint',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid1'],
      },
      attributionBreakpoints: ['/first/second'],
      onResourcePath: '/first',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': ['uuid1'],
      },
    },

    {
      name: 'pass-through: deletes descendant attributions that match the ancestor',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': ['uuid1'],
      },
      onResourcePath: '/first/second',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': [],
      },
    },

    {
      name: 'pass-through: keeps descendant attributions that differ from the ancestor',
      resourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': ['uuid2'],
      },
      onResourcePath: '/first/second',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
        '/first/second': [],
        '/first/second/third': ['uuid2'],
      },
    },

    {
      name: 'is a no-op for a root resource with no ancestor',
      resourcesToAttributions: {
        '/first': ['uuid1'],
      },
      onResourcePath: '',
      expectedResourcesToAttributions: {
        '/first': ['uuid1'],
      },
    },

    {
      name: 'is a no-op for a resource with no attributions and no relevant descendants or ancestors',
      resourcesToAttributions: {
        '/first': [],
        '/first/second': [],
      },
      onResourcePath: '/first',
      expectedResourcesToAttributions: {
        '/first': [],
        '/first/second': [],
      },
    },
  ] as Array<{
    name: string;
    resourcesToAttributions: Record<string, Array<string>>;
    attributionBreakpoints?: Array<string>;
    onResourcePath: string;
    expectedResourcesToAttributions: Record<string, Array<string>>;
  }>)('$name', async (props) => {
    await setupDb({
      resourcePathsToAttributionUuids: props.resourcesToAttributions,
      attributionBreakpoints: props.attributionBreakpoints,
    });

    const resourceId = await getResourceId(props.onResourcePath);
    await getDb()
      .transaction()
      .execute(async (trx) => {
        await removeRedundantAttributions(trx, resourceId);
      });

    await expectDbContent(props.expectedResourcesToAttributions);
  });
});

async function getResourceId(path: string): Promise<number> {
  const result = await getDb()
    .selectFrom('resource')
    .select('id')
    .where('path', '=', path)
    .executeTakeFirstOrThrow();
  return result.id;
}

async function setupDb(props: {
  resourcePathsToAttributionUuids: Record<string, Array<string>>;
  attributionBreakpoints?: Array<string>;
}) {
  const resources = pathsToResources(
    Object.keys(props.resourcePathsToAttributionUuids),
  );

  const attributions: Attributions = {};
  const resourcesToAttributions: ResourcesToAttributions = {};
  const attributionsToResources: AttributionsToResources = {};

  for (const [resourcePath, attributionUuids] of Object.entries(
    props.resourcePathsToAttributionUuids,
  )) {
    resourcesToAttributions[resourcePath] = [];
    for (const attributionUuid of attributionUuids) {
      if (!(attributionUuid in attributions)) {
        attributions[attributionUuid] = { id: attributionUuid, criticality: 0 };
      }
      if (!(attributionUuid in attributionsToResources)) {
        attributionsToResources[attributionUuid] = [];
      }

      resourcesToAttributions[resourcePath].push(attributionUuid);
      attributionsToResources[attributionUuid].push(resourcePath);
    }
  }

  await initializeDb({
    metadata: { projectId: '', fileCreationDate: '' },
    resources,
    config: { classifications: {} },
    manualAttributions: {
      attributions,
      resourcesToAttributions,
      attributionsToResources,
    },
    externalAttributions: {
      attributions: {},
      resourcesToAttributions: {},
      attributionsToResources: {},
    },
    frequentLicenses: { nameOrder: [], texts: {} },
    resolvedExternalAttributions: new Set(),
    attributionBreakpoints: new Set(props.attributionBreakpoints ?? []),
    filesWithChildren: new Set(),
    baseUrlsForSources: {},
    externalAttributionSources: {},
  });
}

async function expectDbContent(
  resourcePathsToAttributionUuids: Record<string, Array<string>>,
) {
  for (const [resourcePath, attributionUuids] of Object.entries(
    resourcePathsToAttributionUuids,
  )) {
    const rows = await getDb()
      .selectFrom('resource_to_attribution')
      .innerJoin(
        'resource',
        'resource.id',
        'resource_to_attribution.resource_id',
      )
      .select('attribution_uuid')
      .where('resource.path', '=', removeTrailingSlash(resourcePath))
      .execute();
    const dbAttributions = rows.map((r) => r.attribution_uuid).toSorted();

    expect(dbAttributions).toEqual(attributionUuids.toSorted());
  }
}
