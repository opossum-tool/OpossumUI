// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';

import {
  setSelectedAttributionId,
  setSelectedResourceId,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import { createAppStore } from '../../state/configure-store';
import { useAttributionSaveReveal } from '../use-attribution-save-reveal';

describe('useAttributionSaveReveal', () => {
  it('publishes a successful save for the selected attribution and resource', () => {
    const store = createAppStore();
    store.dispatch(setSelectedResourceId('/selected-resource', 'auto'));
    store.dispatch(setSelectedAttributionId('saved-attribution'));
    const { result } = renderHook(() => useAttributionSaveReveal(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.publishSaveCompletion(
        { status: 'unchanged' },
        'saved-attribution',
        '/selected-resource',
      );
    });

    expect(
      result.current.getSelectionRevealKey(
        'saved-attribution',
        '/selected-resource',
      ),
    ).toBe('1');
    act(() =>
      result.current.publishSaveCompletion(
        { status: 'unchanged' },
        'saved-attribution',
        '/selected-resource',
      ),
    );
    expect(
      result.current.getSelectionRevealKey(
        'saved-attribution',
        '/selected-resource',
      ),
    ).toBe('2');
  });

  it('uses the resulting attribution ID after a save merges attributions', () => {
    const store = createAppStore();
    store.dispatch(setSelectedResourceId('/selected-resource', 'auto'));
    store.dispatch(setSelectedAttributionId('matching-attribution'));
    const { result } = renderHook(() => useAttributionSaveReveal(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.publishSaveCompletion(
        {
          status: 'remapped',
          attributionUuid: 'saved-attribution',
          newAttributionUuid: 'matching-attribution',
        },
        'saved-attribution',
        '/selected-resource',
      );
    });

    expect(
      result.current.getSelectionRevealKey(
        'matching-attribution',
        '/selected-resource',
      ),
    ).toBe('1');
  });

  it.each([
    ['another attribution', 'other-attribution', '/selected-resource'],
    ['another resource', 'saved-attribution', '/other-resource'],
  ])('does not publish a save for %s', (_description, uuid, resourcePath) => {
    const store = createAppStore();
    store.dispatch(setSelectedResourceId('/selected-resource', 'auto'));
    store.dispatch(setSelectedAttributionId('saved-attribution'));
    const { result } = renderHook(() => useAttributionSaveReveal(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.publishSaveCompletion(
        { status: 'unchanged' },
        uuid,
        resourcePath,
      );
    });

    expect(
      result.current.getSelectionRevealKey(
        'saved-attribution',
        '/selected-resource',
      ),
    ).toBeUndefined();
  });
});
