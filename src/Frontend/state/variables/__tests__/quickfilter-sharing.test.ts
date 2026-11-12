// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  SavedAttributionQuickfilter,
  SavedResourceQuickfilter,
} from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import { setUserSetting } from '../../actions/user-settings-actions/user-settings-actions';
import {
  toAttributionQuickfilterModel,
  toResourceQuickfilterModel,
  useVisibleQuickfilters,
  useVisibleQuickfiltersForResources,
} from '../quickfilter-sharing';

function makeAttributionQuickfilter({
  scope = 'attribution',
  overrides = {},
}: {
  scope?: 'attribution' | 'signal';
  overrides?: Partial<SavedAttributionQuickfilter['filters']>;
} = {}): SavedAttributionQuickfilter {
  return {
    id: faker.string.uuid(),
    name: faker.string.sample(),
    lastUsedAt: faker.number.int(),
    scope,
    filters: {
      filters: [],
      search: '',
      valueFilters: {},
      ...overrides,
    },
  };
}

function makeResourceQuickfilter({
  overrides = {},
}: {
  overrides?: Partial<SavedResourceQuickfilter['filters']>;
} = {}): SavedResourceQuickfilter {
  return {
    id: faker.string.uuid(),
    name: faker.string.sample(),
    lastUsedAt: faker.number.int(),
    scope: 'resource',
    filters: {
      onlyUnreviewedFiles: false,
      onlyWithAiDeferredAttributions: false,
      selectedLicenses: [],
      ...overrides,
    },
  };
}

describe('toResourceQuickfilterModel', () => {
  it('converts license-only quickfilters', () => {
    const quickfilter = makeAttributionQuickfilter({
      overrides: {
        valueFilters: {
          license: [{ id: 'MIT', label: 'MIT' }],
          licenseSearches: ['apa'],
        },
      },
    });

    expect(toResourceQuickfilterModel(quickfilter)).toEqual({
      id: quickfilter.id,
      name: quickfilter.name,
      lastUsedAt: quickfilter.lastUsedAt,
      scope: 'resource',
      filters: {
        onlyUnreviewedFiles: false,
        onlyWithAiDeferredAttributions: false,
        selectedLicenses: [{ id: 'MIT', label: 'MIT' }],
        licenseSearches: ['apa'],
      },
    });
  });

  it.each([
    ['filter keys', { filters: ['firstParty'] }],
    ['a search text', { search: 'react' }],
    ['a classification filter', { valueFilters: { classification: 1 } }],
    ['a criticality filter', { valueFilters: { criticality: 2 } }],
    [
      'an incomplete coordinates filter',
      { valueFilters: { incompleteCoordinates: 'any' } },
    ],
    [
      'an incomplete legal filter',
      { valueFilters: { incompleteLegal: 'copyright' } },
    ],
  ])('rejects quickfilters with %s', (_description, overrides) => {
    expect(
      toResourceQuickfilterModel(
        makeAttributionQuickfilter({
          overrides: overrides as Partial<
            SavedAttributionQuickfilter['filters']
          >,
        }),
      ),
    ).toBeNull();
  });

  it('rejects license conditions combined with unshareable conditions', () => {
    const quickfilter = makeAttributionQuickfilter({
      overrides: {
        search: 'react',
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });

    expect(toResourceQuickfilterModel(quickfilter)).toBeNull();
  });
});

describe('toAttributionQuickfilterModel', () => {
  it('converts license-only quickfilters', () => {
    const quickfilter = makeResourceQuickfilter({
      overrides: {
        selectedLicenses: [{ id: 'MIT', label: 'MIT' }],
        licenseSearches: ['apa'],
      },
    });

    expect(toAttributionQuickfilterModel(quickfilter, 'signal')).toEqual({
      id: quickfilter.id,
      name: quickfilter.name,
      lastUsedAt: quickfilter.lastUsedAt,
      scope: 'signal',
      filters: {
        filters: [],
        search: '',
        valueFilters: {
          license: [{ id: 'MIT', label: 'MIT' }],
          licenseSearches: ['apa'],
        },
      },
    });
  });

  it.each([
    ['only unreviewed files', { onlyUnreviewedFiles: true }],
    [
      'the AI-deferred attribution filter',
      { onlyWithAiDeferredAttributions: true },
    ],
  ])('rejects quickfilters relying on %s', (_description, overrides) => {
    expect(
      toAttributionQuickfilterModel(
        makeResourceQuickfilter({ overrides }),
        'attribution',
      ),
    ).toBeNull();
  });
});

describe('useVisibleQuickfilters', () => {
  it('lists own-scope quickfilters plus shareable resource quickfilters in persistence order', async () => {
    const own = makeAttributionQuickfilter();
    const unshareableResource = makeResourceQuickfilter({
      overrides: { onlyUnreviewedFiles: true },
    });
    const shareableResource = makeResourceQuickfilter({
      overrides: { selectedLicenses: [{ id: 'MIT', label: 'MIT' }] },
    });
    const otherScope = makeAttributionQuickfilter({ scope: 'signal' });
    const { result } = await renderHook(
      () => useVisibleQuickfilters('attribution'),
      {
        actions: [
          setUserSetting({
            savedQuickfilters: [
              own,
              unshareableResource,
              shareableResource,
              otherScope,
            ],
          }),
        ],
      },
    );

    expect(result.current.map(({ id }) => id)).toEqual([
      own.id,
      shareableResource.id,
    ]);
  });
});

describe('useVisibleQuickfiltersForResources', () => {
  it('lists resource quickfilters plus shareable attribution quickfilters in persistence order', async () => {
    const resource = makeResourceQuickfilter();
    const shareableAttribution = makeAttributionQuickfilter({
      overrides: {
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });
    const unshareableAttribution = makeAttributionQuickfilter({
      overrides: { search: 'react' },
    });
    const { result } = await renderHook(
      () => useVisibleQuickfiltersForResources(),
      {
        actions: [
          setUserSetting({
            savedQuickfilters: [
              shareableAttribution,
              unshareableAttribution,
              resource,
            ],
          }),
        ],
      },
    );

    expect(
      result.current.map((quickfilter) => ({
        id: quickfilter.id,
        name: quickfilter.name,
      })),
    ).toEqual([
      { id: shareableAttribution.id, name: shareableAttribution.name },
      { id: resource.id, name: resource.name },
    ]);
  });
});
