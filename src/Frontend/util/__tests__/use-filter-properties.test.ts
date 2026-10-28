// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { deserializeAttributions } from '../../../ElectronBackend/input/parseInputData';
import { setVariable } from '../../state/actions/variables-actions/variables-actions';
import {
  EXTERNAL_ATTRIBUTION_FILTERS,
  initialAttributionFilters,
} from '../../state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../../test-helpers/general-test-helpers';
import { renderHook } from '../../test-helpers/render';
import { useFilterProperties } from '../use-filter-properties';

const data = getParsedInputFileEnrichedWithTestData({
  resources: { file: 1 },
  externalAttributions: deserializeAttributions({
    mit: { licenseName: 'MIT' },
    apache: { licenseName: 'Apache-2.0' },
    bsd: { licenseName: 'BSD-3-Clause', firstParty: true },
  }),
  resourcesToExternalAttributions: { '/file': ['mit', 'apache', 'bsd'] },
});

test('gets counts and license choices with one request when no licenses are selected', async () => {
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
});

test('fetches broader choices only for an active license selection and preserves other filters', async () => {
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
  ).toHaveLength(3);
});
