// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { statistics } from '../statistics';

describe('statistics', () => {
  describe('attributionsOverview', () => {
    it('counts manual attributions needing review', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            uuid1: {
              id: 'uuid1',
              criticality: Criticality.None,
              needsReview: true,
            },
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
          attributionsToResources: {
            uuid1: ['/resource'],
            uuid2: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([
          { name: 'needsReview', count: 1 },
          { name: 'total', count: 2 },
        ]),
      );
    });

    it('counts manual attributions needing follow-up', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            uuid1: {
              id: 'uuid1',
              criticality: Criticality.None,
              followUp: true,
            },
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
          attributionsToResources: {
            uuid1: ['/resource'],
            uuid2: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([{ name: 'followUp', count: 1 }]),
      );
    });

    it('counts first-party manual attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            uuid1: {
              id: 'uuid1',
              criticality: Criticality.None,
              firstParty: true,
            },
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: { '/resource': ['uuid1', 'uuid2'] },
          attributionsToResources: {
            uuid1: ['/resource'],
            uuid2: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([{ name: 'firstParty', count: 1 }]),
      );
    });

    it('counts incomplete manual attributions (missing legal or coordinates)', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            complete: {
              id: 'complete',
              criticality: Criticality.None,
              packageName: 'pkg',
              packageType: 'npm',
              url: 'https://example.com',
              copyright: '(c) 2024',
              licenseName: 'MIT',
            },
            incomplete: { id: 'incomplete', criticality: Criticality.None },
          },
          resourcesToAttributions: {
            '/resource': ['complete', 'incomplete'],
          },
          attributionsToResources: {
            complete: ['/resource'],
            incomplete: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([
          { name: 'incomplete', count: 1 },
          { name: 'total', count: 2 },
        ]),
      );
    });

    it('does not count external attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            uuid1: { id: 'uuid1', criticality: Criticality.None },
          },
          resourcesToAttributions: { '/resource': ['uuid1'] },
          attributionsToResources: { uuid1: ['/resource'] },
        },
        externalAttributions: {
          attributions: {
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: { '/resource': ['uuid2'] },
          attributionsToResources: { uuid2: ['/resource'] },
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([{ name: 'total', count: 1 }]),
      );
    });

    it('returns zero counts when there are no manual attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual([
        { name: 'needsReview', count: 0 },
        { name: 'followUp', count: 0 },
        { name: 'firstParty', count: 0 },
        { name: 'incomplete', count: 0 },
        { name: 'total', count: 0 },
      ]);
    });
  });

  describe('incompleteAttributions', () => {
    it('splits manual attributions into complete and incomplete', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            complete: {
              id: 'complete',
              criticality: Criticality.None,
              packageName: 'pkg',
              packageType: 'npm',
              url: 'https://example.com',
              copyright: '(c) 2024',
              licenseName: 'MIT',
            },
            incomplete1: {
              id: 'incomplete1',
              criticality: Criticality.None,
            },
            incomplete2: {
              id: 'incomplete2',
              criticality: Criticality.None,
            },
          },
          resourcesToAttributions: {
            '/resource': ['complete', 'incomplete1', 'incomplete2'],
          },
          attributionsToResources: {
            complete: ['/resource'],
            incomplete1: ['/resource'],
            incomplete2: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.incompleteAttributions).toEqual([
        { name: 'complete', count: 1 },
        { name: 'incomplete', count: 2 },
      ]);
    });
  });

  describe('mostFrequentLicenses', () => {
    it('returns top 5 licenses from unresolved external attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
            b: { id: 'b', criticality: Criticality.None, licenseName: 'MIT' },
            c: {
              id: 'c',
              criticality: Criticality.None,
              licenseName: 'Apache-2.0',
            },
            d: {
              id: 'd',
              criticality: Criticality.None,
              licenseName: 'Apache-2.0',
            },
            e: {
              id: 'e',
              criticality: Criticality.None,
              licenseName: 'Apache-2.0',
            },
            f: { id: 'f', criticality: Criticality.None, licenseName: 'BSD' },
          },
          resourcesToAttributions: {
            '/resource': ['a', 'b', 'c', 'd', 'e', 'f'],
          },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
            c: ['/resource'],
            d: ['/resource'],
            e: ['/resource'],
            f: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([
        { name: 'Apache-2.0', count: 3 },
        { name: 'MIT', count: 2 },
        { name: 'BSD', count: 1 },
      ]);
    });

    it('groups licenses by canonical name (case-insensitive, ignoring dashes and spaces)', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
            b: { id: 'b', criticality: Criticality.None, licenseName: 'mit' },
            c: {
              id: 'c',
              criticality: Criticality.None,
              licenseName: 'Apache-2.0',
            },
            d: {
              id: 'd',
              criticality: Criticality.None,
              licenseName: 'Apache 2.0',
            },
          },
          resourcesToAttributions: {
            '/resource': ['a', 'b', 'c', 'd'],
          },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
            c: ['/resource'],
            d: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ count: 2 }),
          expect.objectContaining({ count: 2 }),
        ]),
      );
      expect(result.mostFrequentLicenses).toHaveLength(2);
    });

    it('excludes resolved external attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
            b: {
              id: 'b',
              criticality: Criticality.None,
              licenseName: 'Apache-2.0',
            },
          },
          resourcesToAttributions: { '/resource': ['a', 'b'] },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
          },
        },
        resolvedExternalAttributions: new Set(['b']),
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([{ name: 'MIT', count: 1 }]);
    });

    it('excludes attributions with no license name', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
            b: { id: 'b', criticality: Criticality.None },
            c: {
              id: 'c',
              criticality: Criticality.None,
              licenseName: '',
            },
          },
          resourcesToAttributions: { '/resource': ['a', 'b', 'c'] },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
            c: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([{ name: 'MIT', count: 1 }]);
    });

    it('does not count manual attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
          },
          resourcesToAttributions: { '/resource': ['a'] },
          attributionsToResources: { a: ['/resource'] },
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([]);
    });

    it('groups remaining licenses beyond top 5 into Other', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a1: {
              id: 'a1',
              criticality: Criticality.None,
              licenseName: 'License-A',
            },
            a2: {
              id: 'a2',
              criticality: Criticality.None,
              licenseName: 'License-A',
            },
            b1: {
              id: 'b1',
              criticality: Criticality.None,
              licenseName: 'License-B',
            },
            b2: {
              id: 'b2',
              criticality: Criticality.None,
              licenseName: 'License-B',
            },
            c: {
              id: 'c',
              criticality: Criticality.None,
              licenseName: 'License-C',
            },
            d: {
              id: 'd',
              criticality: Criticality.None,
              licenseName: 'License-D',
            },
            e: {
              id: 'e',
              criticality: Criticality.None,
              licenseName: 'License-E',
            },
            f: {
              id: 'f',
              criticality: Criticality.None,
              licenseName: 'License-F',
            },
            g: {
              id: 'g',
              criticality: Criticality.None,
              licenseName: 'License-G',
            },
          },
          resourcesToAttributions: {
            '/resource': ['a1', 'a2', 'b1', 'b2', 'c', 'd', 'e', 'f', 'g'],
          },
          attributionsToResources: {
            a1: ['/resource'],
            a2: ['/resource'],
            b1: ['/resource'],
            b2: ['/resource'],
            c: ['/resource'],
            d: ['/resource'],
            e: ['/resource'],
            f: ['/resource'],
            g: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toHaveLength(6);
      expect(result.mostFrequentLicenses.at(-1)).toEqual({
        name: 'Other',
        count: 2,
      });
    });
  });

  describe('signalsByCriticality', () => {
    it('counts unresolved external attributions by criticality', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.High },
            b: { id: 'b', criticality: Criticality.High },
            c: { id: 'c', criticality: Criticality.Medium },
            d: { id: 'd', criticality: Criticality.None },
          },
          resourcesToAttributions: {
            '/resource': ['a', 'b', 'c', 'd'],
          },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
            c: ['/resource'],
            d: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.signalsByCriticality).toEqual([
        { name: Criticality.High, count: 2 },
        { name: Criticality.Medium, count: 1 },
        { name: Criticality.None, count: 1 },
      ]);
    });

    it('excludes resolved external attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.High },
            b: { id: 'b', criticality: Criticality.High },
          },
          resourcesToAttributions: { '/resource': ['a', 'b'] },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
          },
        },
        resolvedExternalAttributions: new Set(['b']),
      });

      const { result } = await statistics();

      expect(result.signalsByCriticality).toEqual([
        { name: Criticality.High, count: 1 },
      ]);
    });

    it('does not count manual attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        manualAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.High },
          },
          resourcesToAttributions: { '/resource': ['a'] },
          attributionsToResources: { a: ['/resource'] },
        },
      });

      const { result } = await statistics();

      expect(result.signalsByCriticality).toEqual([]);
    });
  });

  describe('signalsByClassification', () => {
    it('counts unresolved external attributions by classification', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, classification: 1 },
            b: { id: 'b', criticality: Criticality.None, classification: 1 },
            c: { id: 'c', criticality: Criticality.None, classification: 2 },
            d: { id: 'd', criticality: Criticality.None },
          },
          resourcesToAttributions: {
            '/resource': ['a', 'b', 'c', 'd'],
          },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
            c: ['/resource'],
            d: ['/resource'],
          },
        },
      });

      const { result } = await statistics();

      expect(result.signalsByClassification).toEqual([
        { name: 2, count: 1 },
        { name: 1, count: 2 },
        { name: 0, count: 1 },
      ]);
    });

    it('excludes resolved external attributions', async () => {
      await initializeDbWithTestData({
        resources: pathsToResources(['/resource']),
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, classification: 1 },
            b: { id: 'b', criticality: Criticality.None, classification: 1 },
          },
          resourcesToAttributions: { '/resource': ['a', 'b'] },
          attributionsToResources: {
            a: ['/resource'],
            b: ['/resource'],
          },
        },
        resolvedExternalAttributions: new Set(['b']),
      });

      const { result } = await statistics();

      expect(result.signalsByClassification).toEqual([{ name: 1, count: 1 }]);
    });
  });
});
