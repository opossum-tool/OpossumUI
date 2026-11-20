// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { deserializeAttributions } from '../../../ElectronBackend/input/parseInputData';
import { setSelectedResourceId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { setVariable } from '../../state/actions/variables-actions/variables-actions';
import {
  EXTERNAL_ATTRIBUTION_FILTERS,
  initialAttributionFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
} from '../../state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../../test-helpers/general-test-helpers';
import { renderHook } from '../../test-helpers/render';
import { backend } from '../backendClient';
import {
  useFilterProperties,
  useResourceTreeFilterProperties,
} from '../use-filter-properties';

const data = getParsedInputFileEnrichedWithTestData({
  resources: { file: 1 },
  externalAttributions: deserializeAttributions({
    mit: { licenseName: 'MIT' },
    apache: { licenseName: 'Apache-2.0' },
    bsd: { licenseName: 'BSD-3-Clause', firstParty: true },
  }),
  resourcesToExternalAttributions: { '/file': ['mit', 'apache', 'bsd'] },
});

const relationData = getParsedInputFileEnrichedWithTestData({
  resources: {
    parent: { target: { child: 1, inherited: 1 }, sibling: 1 },
  },
  manualAttributions: deserializeAttributions({
    mit: { licenseName: 'MIT' },
    bsd: { licenseName: 'BSD-3-Clause' },
    apache: { licenseName: 'Apache-2.0' },
    isc: { licenseName: 'ISC' },
    zlib: { licenseName: 'Zlib' },
  }),
  resourcesToManualAttributions: {
    '/parent/target/': ['mit', 'bsd'],
    '/parent/target/child': ['apache'],
    '/parent/': ['isc'],
    '/parent/sibling': ['zlib'],
  },
});

test.each([
  { mode: 'manual', relation: 'resource', licenses: ['bsd3clause', 'mit'] },
  { mode: 'manual', relation: 'children', licenses: ['apache2.0'] },
  { mode: 'manual', relation: 'parents', licenses: ['bsd3clause', 'mit'] },
  { mode: 'manual', relation: 'unrelated', licenses: ['isc', 'zlib'] },
  {
    mode: 'manual',
    relation: undefined,
    licenses: ['apache2.0', 'bsd3clause', 'isc', 'mit', 'zlib'],
  },
  {
    mode: 'reportTable',
    relation: 'resource',
    licenses: ['apache2.0', 'bsd3clause', 'isc', 'mit', 'zlib'],
  },
] as const)(
  'scopes $mode counts and license options to $relation',
  async ({ mode, relation, licenses }) => {
    const { result } = await renderHook(
      () => useFilterProperties({ mode, relation, enabled: true }),
      {
        data: relationData,
        actions: [
          // A resource with its own manual attributions does not inherit any.
          setSelectedResourceId(
            relation === 'parents'
              ? '/parent/target/inherited'
              : '/parent/target/',
            'auto',
          ),
        ],
      },
    );

    await waitFor(() => {
      expect(result.current.filterProps?.total).toBe(licenses.length);
      expect(result.current.licenses.map(({ id }) => id)).toEqual(licenses);
    });
  },
);

test('refreshes manual license options when switching relations while ignoring selected licenses', async () => {
  const { result, rerender } = await renderHook(
    ({ relation }: { relation: 'resource' | 'children' }) =>
      useFilterProperties({ mode: 'manual', relation, enabled: true }),
    {
      data: relationData,
      initialProps: { relation: 'resource' },
      actions: [
        setSelectedResourceId('/parent/target/', 'auto'),
        setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
          ...initialAttributionFilters,
          valueFilters: { license: [{ id: 'mit', label: 'MIT' }] },
        }),
      ],
    },
  );

  await waitFor(() => {
    expect(result.current.filterProps?.total).toBe(1);
    expect(result.current.licenses.map(({ id }) => id)).toEqual([
      'bsd3clause',
      'mit',
    ]);
  });

  rerender({ relation: 'children' });

  await waitFor(() => {
    expect(result.current.filterProps).toBeNull();
    expect(result.current.licenses).toEqual([
      { id: 'apache2.0', label: 'Apache-2.0' },
    ]);
  });
});

test('gets counts and license choices with one request each', async () => {
  const { result } = await renderHook(
    () => useFilterProperties({ mode: 'external', enabled: true }),
    { data },
  );

  await waitFor(() => {
    expect(result.current.filterProps?.total).toBe(3);
    expect(result.current.licenses).toHaveLength(3);
    expect(result.current.licenseOptionsLoading).toBe(false);
  });
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'filterProperties'),
  ).toHaveLength(1);
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'licenseOptions'),
  ).toHaveLength(1);
});

test('refreshes options for other filters while ignoring selected licenses', async () => {
  const { result, store } = await renderHook(
    () => useFilterProperties({ mode: 'external', enabled: true }),
    { data },
  );
  await waitFor(() => expect(result.current.filterProps?.total).toBe(3));

  act(() => {
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        filters: ['thirdParty'],
        valueFilters: { license: [{ id: 'mit', label: 'MIT' }] },
      }),
    );
  });

  await waitFor(() => {
    expect(result.current.filterProps?.total).toBe(1);
    expect(result.current.filterProps?.licenses).toEqual([
      { id: 'mit', label: 'MIT' },
    ]);
    expect(result.current.licenses).toEqual([
      { id: 'apache2.0', label: 'Apache-2.0' },
      { id: 'mit', label: 'MIT' },
    ]);
    expect(result.current.licenseOptionsLoading).toBe(false);
  });
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'filterProperties'),
  ).toHaveLength(2);
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'licenseOptions'),
  ).toHaveLength(2);

  act(() => {
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        filters: ['thirdParty'],
        valueFilters: { license: [{ id: 'apache2.0', label: 'Apache-2.0' }] },
      }),
    );
  });
  await waitFor(() =>
    expect(result.current.filterProps?.licenses).toEqual([
      { id: 'apache2.0', label: 'Apache-2.0' },
    ]),
  );
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'licenseOptions'),
  ).toHaveLength(2);
});

test('refreshes license options after resolving an attribution', async () => {
  const { result } = await renderHook(
    () => ({
      options: useResourceTreeFilterProperties({ external: true }),
      resolve: backend.resolveAttributions.useMutation(),
    }),
    { data },
  );
  await waitFor(() => expect(result.current.options.licenses).toHaveLength(3));
  await act(async () => {
    await result.current.resolve.mutateAsync({
      selection: { mode: 'explicit', attributionUuids: ['mit'] },
    });
  });
  await waitFor(() => expect(result.current.options.licenses).toHaveLength(2));
});

test('keeps options on every render without refetching when selecting, clearing, and reselecting', async () => {
  const renderedLicenses: Array<Array<string>> = [];
  const { result, store } = await renderHook(
    () => {
      const options = useFilterProperties({ mode: 'external', enabled: true });
      renderedLicenses.push(options.licenses.map(({ id }) => id));
      return { options };
    },
    { data },
  );
  await waitFor(() => expect(result.current.options.licenses).toHaveLength(3));
  renderedLicenses.length = 0;

  for (const license of [
    [{ id: 'mit', label: 'MIT' }],
    [
      { id: 'mit', label: 'MIT' },
      { id: 'apache2.0', label: 'Apache-2.0' },
    ],
    [],
    [{ id: 'apache2.0', label: 'Apache-2.0' }],
  ]) {
    act(() => {
      store.dispatch(
        setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
          ...initialAttributionFilters,
          valueFilters: { license },
        }),
      );
    });
    await waitFor(() => {
      expect(result.current.options.filterProps?.total).toBe(
        license.length ? license.length : 3,
      );
      expect(result.current.options.loading).toBe(false);
    });
  }
  expect(renderedLicenses.length).toBeGreaterThan(0);
  expect(renderedLicenses.every((licenses) => licenses.length === 3)).toBe(
    true,
  );
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'licenseOptions'),
  ).toHaveLength(1);
});

test('mutations refresh options with selected licenses', async () => {
  const { result, store } = await renderHook(
    () => ({
      options: useFilterProperties({ mode: 'external', enabled: true }),
      resolve: backend.resolveAttributions.useMutation(),
    }),
    { data },
  );
  await waitFor(() => expect(result.current.options.licenses).toHaveLength(3));
  act(() => {
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        valueFilters: { license: [{ id: 'mit', label: 'MIT' }] },
      }),
    );
  });
  await waitFor(() =>
    expect(result.current.options.filterProps?.total).toBe(1),
  );
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'licenseOptions'),
  ).toHaveLength(1);
  await act(async () => {
    await result.current.resolve.mutateAsync({
      selection: { mode: 'explicit', attributionUuids: ['apache'] },
    });
  });
  await waitFor(() =>
    expect(result.current.options.licenses.map(({ id }) => id)).toEqual([
      'bsd3clause',
      'mit',
    ]),
  );
  expect(
    vi
      .mocked(window.electronAPI.api)
      .mock.calls.filter(([command]) => command === 'licenseOptions'),
  ).toHaveLength(2);
});
