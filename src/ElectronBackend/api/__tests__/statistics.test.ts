// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import { licenseTable, statistics } from '../statistics';

describe('statistics', () => {
  describe('attributionsOverview', () => {
    it('counts manual attributions needing review', async () => {
      await initializeDbWithTestData({
        manualAttributions: {
          attributions: {
            uuid1: {
              id: 'uuid1',
              criticality: Criticality.None,
              needsReview: true,
            },
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
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
        manualAttributions: {
          attributions: {
            uuid1: {
              id: 'uuid1',
              criticality: Criticality.None,
              followUp: true,
            },
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([{ name: 'followUp', count: 1 }]),
      );
    });

    it('counts first-party manual attributions', async () => {
      await initializeDbWithTestData({
        manualAttributions: {
          attributions: {
            uuid1: {
              id: 'uuid1',
              criticality: Criticality.None,
              firstParty: true,
            },
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([{ name: 'firstParty', count: 1 }]),
      );
    });

    it('counts incomplete manual attributions (missing legal or coordinates)', async () => {
      await initializeDbWithTestData({
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
          resourcesToAttributions: {},
          attributionsToResources: {},
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
        manualAttributions: {
          attributions: {
            uuid1: { id: 'uuid1', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
        externalAttributions: {
          attributions: {
            uuid2: { id: 'uuid2', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.attributionsOverview).toEqual(
        expect.arrayContaining([{ name: 'total', count: 1 }]),
      );
    });

    it('returns zero counts when there are no manual attributions', async () => {
      await initializeDbWithTestData({});

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
          resourcesToAttributions: {},
          attributionsToResources: {},
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
          resourcesToAttributions: {},
          attributionsToResources: {},
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
          resourcesToAttributions: {},
          attributionsToResources: {},
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
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
            b: {
              id: 'b',
              criticality: Criticality.None,
              licenseName: 'Apache-2.0',
            },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
        resolvedExternalAttributions: new Set(['b']),
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([{ name: 'MIT', count: 1 }]);
    });

    it('excludes attributions with no license name', async () => {
      await initializeDbWithTestData({
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
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([{ name: 'MIT', count: 1 }]);
    });

    it('does not count manual attributions', async () => {
      await initializeDbWithTestData({
        manualAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.None, licenseName: 'MIT' },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.mostFrequentLicenses).toEqual([]);
    });

    it('groups remaining licenses beyond top 5 into Other', async () => {
      await initializeDbWithTestData({
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
          resourcesToAttributions: {},
          attributionsToResources: {},
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
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.High, licenseName: 'MIT' },
            b: { id: 'b', criticality: Criticality.High, licenseName: 'MIT' },
            c: { id: 'c', criticality: Criticality.Medium, licenseName: 'MIT' },
            d: { id: 'd', criticality: Criticality.None, licenseName: 'MIT' },
            e: { id: 'd', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.signalsByCriticality).toEqual([
        { name: Criticality.High, count: 2 },
        { name: Criticality.Medium, count: 1 },
        { name: Criticality.None, count: 1 },
        { name: null, count: 1 },
      ]);
    });

    it('excludes resolved external attributions', async () => {
      await initializeDbWithTestData({
        externalAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.High, licenseName: 'MIT' },
            b: { id: 'b', criticality: Criticality.High, licenseName: 'MIT' },
            c: { id: 'c', criticality: Criticality.High },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
        resolvedExternalAttributions: new Set(['b', 'c']),
      });

      const { result } = await statistics();

      expect(result.signalsByCriticality).toEqual([
        { name: Criticality.High, count: 1 },
      ]);
    });

    it('does not count manual attributions', async () => {
      await initializeDbWithTestData({
        manualAttributions: {
          attributions: {
            a: { id: 'a', criticality: Criticality.High, licenseName: 'MIT' },
            b: { id: 'b', criticality: Criticality.High },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.signalsByCriticality).toEqual([]);
    });
  });

  describe('signalsByClassification', () => {
    it('counts unresolved external attributions by classification', async () => {
      await initializeDbWithTestData({
        externalAttributions: {
          attributions: {
            a: {
              id: 'a',
              criticality: Criticality.None,
              classification: 1,
              licenseName: 'MIT',
            },
            b: {
              id: 'b',
              criticality: Criticality.None,
              classification: 1,
              licenseName: 'MIT',
            },
            c: {
              id: 'c',
              criticality: Criticality.None,
              classification: 2,
              licenseName: 'MIT',
            },
            d: {
              id: 'd',
              criticality: Criticality.None,
              classification: 0,
              licenseName: 'MIT',
            },
            e: { id: 'e', criticality: Criticality.None, classification: 2 },
            f: { id: 'f', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
      });

      const { result } = await statistics();

      expect(result.signalsByClassification).toEqual([
        { name: 2, count: 1 },
        { name: 1, count: 2 },
        { name: 0, count: 1 },
        { name: null, count: 2 },
      ]);
    });

    it('excludes resolved external attributions', async () => {
      await initializeDbWithTestData({
        externalAttributions: {
          attributions: {
            a: {
              id: 'a',
              criticality: Criticality.None,
              classification: 1,
              licenseName: 'MIT',
            },
            b: { id: 'b', criticality: Criticality.None, classification: 1 },
            c: {
              id: 'c',
              criticality: Criticality.None,
              classification: 1,
              licenseName: 'MIT',
            },
            d: { id: 'd', criticality: Criticality.None, classification: 1 },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
        resolvedExternalAttributions: new Set(['c', 'd']),
      });

      const { result } = await statistics();

      expect(result.signalsByClassification).toEqual([
        { name: 1, count: 1 },
        { name: null, count: 1 },
      ]);
    });
  });
});

describe('licenseTable', () => {
  it('counts attributions per license and source', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'MIT',
            source: { name: 'SC' },
          },
          ext2: {
            id: 'ext2',
            criticality: Criticality.None,
            licenseName: 'MIT',
            source: { name: 'SC' },
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1 },
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense).toEqual([
      {
        licenseName: 'MIT',
        criticality: 0,
        classification: 0,
        perSource: { ScanCode: 2 },
        total: 2,
      },
    ]);
    expect(result.totals).toEqual({ perSource: { ScanCode: 2 }, total: 2 });
  });

  it('splits rows by criticality and classification', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'MIT',
            source: { name: 'SC' },
          },
          ext2: {
            id: 'ext2',
            criticality: Criticality.High,
            licenseName: 'MIT',
            source: { name: 'SC' },
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1 },
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense).toHaveLength(2);
    expect(result.perLicense).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          licenseName: 'MIT',
          criticality: 0,
          total: 1,
        }),
        expect.objectContaining({
          licenseName: 'MIT',
          criticality: Criticality.High,
          total: 1,
        }),
      ]),
    );
    expect(result.totals.total).toBe(2);
  });

  it('distributes counts across multiple sources in one row', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'Apache-2.0',
            source: { name: 'SC' },
          },
          ext2: {
            id: 'ext2',
            criticality: Criticality.None,
            licenseName: 'Apache-2.0',
            source: { name: 'REUSE' },
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1 },
        REUSE: { name: 'REUSE', priority: 2 },
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense).toHaveLength(1);
    expect(result.perLicense[0]).toEqual({
      licenseName: 'Apache-2.0',
      criticality: 0,
      classification: 0,
      perSource: { ScanCode: 1, REUSE: 1 },
      total: 2,
    });
    expect(result.totals).toEqual({
      perSource: { ScanCode: 1, REUSE: 1 },
      total: 2,
    });
  });

  it('groups license names case-insensitively and ignoring dashes/spaces', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'Apache-2.0',
            source: { name: 'SC' },
          },
          ext2: {
            id: 'ext2',
            criticality: Criticality.None,
            licenseName: 'apache 2.0',
            source: { name: 'SC' },
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1 },
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense).toHaveLength(1);
    expect(result.perLicense[0].total).toBe(2);
  });

  it('falls back to source key when external_attribution_source name is unavailable', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'MIT',
            source: { name: 'UNKNOWN_KEY' },
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense[0].perSource).toEqual({ UNKNOWN_KEY: 1 });
  });

  it('uses dash as source name when attribution has no source', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'MIT',
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense[0].perSource).toEqual({ '-': 1 });
  });

  it('includes only unresolved external attributions', async () => {
    await initializeDbWithTestData({
      resources: {},
      manualAttributions: {
        attributions: {
          manual1: {
            id: 'manual1',
            criticality: Criticality.None,
            licenseName: 'MIT',
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: Criticality.None,
            licenseName: 'Apache-2.0',
          },
          ext2: {
            id: 'ext2',
            criticality: Criticality.None,
            licenseName: 'BSD',
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      resolvedExternalAttributions: new Set(['ext2']),
    });

    const { result } = await licenseTable();

    expect(result.perLicense[0].licenseName).toBe('Apache-2.0');
    expect(result.totals.total).toBe(1);
  });

  it('defaults null criticality and classification to 0', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: {
            id: 'ext1',
            criticality: undefined as unknown as Criticality,
            licenseName: 'MIT',
          },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense[0].criticality).toBe(0);
    expect(result.perLicense[0].classification).toBe(0);
  });

  it('handles null license names', async () => {
    await initializeDbWithTestData({
      resources: {},
      externalAttributions: {
        attributions: {
          ext1: { id: 'ext1', criticality: Criticality.None },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
    });

    const { result } = await licenseTable();

    expect(result.perLicense).toHaveLength(1);
    expect(result.perLicense[0].licenseName).toBeNull();
  });
});
