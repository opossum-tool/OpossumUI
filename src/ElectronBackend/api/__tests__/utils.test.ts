// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Attributions,
  type AttributionsToResources,
  type ResourcesToAttributions,
} from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getDb } from '../../db/db';
import {
  removeRedundantAttributions,
  removeTrailingSlash,
  withBatching,
} from '../utils';

describe('withBatching', () => {
  it('calls f with undefined and wraps result when input is undefined', async () => {
    const f = vi.fn().mockResolvedValue('result');

    const results = await withBatching(undefined, f);

    expect(f).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(results).toEqual(['result']);
  });

  it('processes all items in a single batch when input fits', async () => {
    const input = [1, 2, 3];
    const f = vi.fn().mockResolvedValue('ok');

    const results = await withBatching(input, f);

    expect(f).toHaveBeenCalledExactlyOnceWith([1, 2, 3]);
    expect(results).toEqual(['ok']);
  });

  it('splits input into multiple batches according to batchSize', async () => {
    const input = [1, 2, 3, 4, 5];
    const f = vi
      .fn()
      .mockImplementation((batch: number[]) =>
        Promise.resolve(batch.reduce((a, b) => a + b, 0)),
      );

    const results = await withBatching(input, f, { batchSize: 2 });

    expect(f).toHaveBeenCalledTimes(3);
    expect(f).toHaveBeenNthCalledWith(1, [1, 2]);
    expect(f).toHaveBeenNthCalledWith(2, [3, 4]);
    expect(f).toHaveBeenNthCalledWith(3, [5]);
    expect(results).toEqual([3, 7, 5]);
  });

  it('returns an empty array for empty input', async () => {
    const f = vi.fn();

    const results = await withBatching([], f);

    expect(f).not.toHaveBeenCalled();
    expect(results).toEqual([]);
  });
});

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
        await removeRedundantAttributions(trx, { resourceIds: [resourceId] });
      });

    await expectDbContent(props.expectedResourcesToAttributions);
    await expectCwaConsistency();
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

  await initializeDbWithTestData({
    resources,
    manualAttributions: {
      attributions,
      resourcesToAttributions,
      attributionsToResources,
    },
    attributionBreakpoints: new Set(props.attributionBreakpoints ?? []),
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

async function expectCwaConsistency() {
  const resources = await getDb()
    .selectFrom('resource')
    .innerJoin('cwa', 'cwa.resource_id', 'resource.id')
    .select([
      'resource.id',
      'resource.path',
      'resource.parent_id',
      'resource.is_attribution_breakpoint',
      'cwa.manual',
    ])
    .execute();

  const resourcesWithManualAttributions = new Set(
    (
      await getDb()
        .selectFrom('resource_to_attribution')
        .select('resource_id')
        .distinct()
        .where('attribution_is_external', '=', 0)
        .execute()
    ).map((r) => r.resource_id),
  );

  const cwaManualByResourceId = new Map(resources.map((r) => [r.id, r.manual]));

  for (const resource of resources) {
    if (resourcesWithManualAttributions.has(resource.id)) {
      expect(
        resource.manual,
        `CWA manual for '${resource.path}' should point to itself`,
      ).toBe(resource.id);
    } else if (
      resource.is_attribution_breakpoint === 0 &&
      resource.parent_id !== null
    ) {
      const parentManual =
        cwaManualByResourceId.get(resource.parent_id) ?? null;
      expect(
        resource.manual,
        `CWA manual for '${resource.path}' should match its parent's CWA`,
      ).toBe(parentManual);
    } else {
      expect(
        resource.manual,
        `CWA manual for '${resource.path}' should be null`,
      ).toBeNull();
    }
  }
}
