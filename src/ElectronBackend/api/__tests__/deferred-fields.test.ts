// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Attributions } from '../../../shared/shared-types';
import { getSaveFileArgs } from '../getSaveFileArgs';
import { mutations } from '../mutations';
import { queries } from '../queries';
import {
  attributionFixture,
  initializeAiAttributionFixture,
  linkedAttributionIds,
} from './ai-attribution-test-helpers';

describe('deferred fields', () => {
  it.each([
    {
      name: 'local save',
      readonlyRules: [],
      modify: (attributions: Attributions) =>
        mutations.modifyOrMatchOnlyOnOneResource({
          resourcePath: '/source',
          attributions,
        }),
    },
    {
      name: 'mixed attribution edit',
      readonlyRules: [{ path: '/other', readonly: true }],
      modify: (attributions: Attributions) =>
        mutations.updateAttributions({ attributions }),
    },
  ])(
    'preserves reasons when copying metadata for a $name',
    async ({ readonlyRules, modify }) => {
      const metadata = {
        humanModified: false,
        deferredFields: {
          license: 'Needs review',
          future: { nested: [1, true] },
        },
        opaque: { kept: true },
        deferred: { opaque: [true] },
      };
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/other'],
        attributions: {
          shared: attributionFixture('shared', {
            packageName: 'before',
            aiAttributions: metadata,
          }),
        },
        resourceLinks: { '/source': ['shared'], '/other': ['shared'] },
        readonlyRules,
      });
      const attributions = {
        shared: attributionFixture('shared', { packageName: 'after' }),
      };

      await modify(attributions);

      const [copyUuid] = await linkedAttributionIds('/source');
      expect(copyUuid).not.toBe('shared');
      expect(await linkedAttributionIds('/other')).toEqual(['shared']);
      const { result } = await getSaveFileArgs();
      expect(result.manualAttributions.shared.aiAttributions).toEqual(metadata);
      expect(result.manualAttributions[copyUuid].aiAttributions).toEqual({
        ...metadata,
        humanModified: true,
      });
      const { result: details } = await queries.getAttributionData({
        attributionUuid: copyUuid,
      });
      expect(details.packageInfo.aiStatus).toEqual({
        deferred: true,
        humanModified: true,
      });
    },
  );

  it.each([
    {
      name: 'equivalent objects with reordered keys',
      source: { license: 'Review license', name: 'Review name' },
      target: { name: 'Review name', license: 'Review license' },
      expectedSourceLinks: ['target'],
    },
    {
      name: 'different reasons',
      source: { license: 'First reason' },
      target: { license: 'Second reason' },
      expectedSourceLinks: ['source'],
    },
    {
      name: 'different unknown nested contents',
      source: { future: { nested: [1, true] } },
      target: { future: { nested: [2, true] } },
      expectedSourceLinks: ['source'],
    },
    {
      name: 'absent source and empty target',
      source: undefined,
      target: {},
      expectedSourceLinks: ['source'],
    },
    {
      name: 'empty source and absent target',
      source: {},
      target: undefined,
      expectedSourceLinks: ['source'],
    },
    {
      name: 'two empty objects',
      source: {},
      target: {},
      expectedSourceLinks: ['target'],
    },
  ])(
    'matches attributions correctly for $name',
    async ({ source, target, expectedSourceLinks }) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/target'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'before',
            aiAttributions: {
              humanModified: true,
              deferredFields: source,
              opaque: { kept: true },
              deferred: { opaque: [true] },
            },
          }),
          target: attributionFixture('target', {
            packageName: 'after',
            aiAttributions: {
              humanModified: true,
              deferredFields: target,
              opaque: { kept: true },
              deferred: { opaque: [true] },
            },
          }),
        },
        resourceLinks: { '/source': ['source'], '/target': ['target'] },
      });

      await mutations.updateOrMatchAttributions({
        attributions: {
          source: attributionFixture('source', { packageName: 'after' }),
        },
      });

      expect(await linkedAttributionIds('/source')).toEqual(
        expectedSourceLinks,
      );
      expect(await linkedAttributionIds('/target')).toEqual(['target']);
    },
  );
});
