// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getSaveFileArgs } from '../getSaveFileArgs';
import { mutations } from '../mutations';
import { queries } from '../queries';
import {
  attributionFixture,
  initializeAiAttributionFixture,
  linkedAttributionIds,
} from './ai-attribution-test-helpers';

describe('deferred fields', () => {
  it.each(['local save', 'mixed attribution edit'])(
    'preserves reasons when copying metadata for a %s',
    async (operation) => {
      const metadata = {
        humanModified: false,
        deferredFields: {
          license: 'Needs review',
          future: { nested: [1, true] },
        },
        opaque: { kept: true },
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
        readonlyRules:
          operation === 'mixed attribution edit'
            ? [{ path: '/other', readonly: true }]
            : [],
      });
      const attributions = {
        shared: attributionFixture('shared', { packageName: 'after' }),
      };

      if (operation === 'local save') {
        await mutations.modifyOrMatchOnlyOnOneResource({
          resourcePath: '/source',
          attributions,
        });
      } else {
        await mutations.updateAttributions({ attributions });
      }

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
      expect(details.packageInfo.aiAttributions).toEqual({
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
      matches: true,
    },
    {
      name: 'different reasons',
      source: { license: 'First reason' },
      target: { license: 'Second reason' },
      matches: false,
    },
    {
      name: 'different unknown nested contents',
      source: { future: { nested: [1, true] } },
      target: { future: { nested: [2, true] } },
      matches: false,
    },
    {
      name: 'absent source and empty target',
      source: undefined,
      target: {},
      matches: false,
    },
    {
      name: 'empty source and absent target',
      source: {},
      target: undefined,
      matches: false,
    },
    {
      name: 'two empty objects',
      source: {},
      target: {},
      matches: true,
    },
  ])(
    'matches attributions correctly for $name',
    async ({ source, target, matches }) => {
      await initializeAiAttributionFixture({
        resourcePaths: ['/source', '/target'],
        attributions: {
          source: attributionFixture('source', {
            packageName: 'before',
            aiAttributions: {
              humanModified: true,
              deferredFields: source,
              opaque: { kept: true },
            },
          }),
          target: attributionFixture('target', {
            packageName: 'after',
            aiAttributions: {
              humanModified: true,
              deferredFields: target,
              opaque: { kept: true },
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

      expect(await linkedAttributionIds('/source')).toEqual([
        matches ? 'target' : 'source',
      ]);
      expect(await linkedAttributionIds('/target')).toEqual(['target']);
    },
  );
});
