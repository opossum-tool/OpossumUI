// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { setSelectedAttributionId } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { createAppStore } from '../../state/configure-store';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { backend, setDatabaseInitialized } from '../backendClient';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../use-focused-attribution-outcome';
import { useSelectedAttribution } from '../use-selected-attribution';

describe('useFocusedAttributionOutcomeBeforeInvalidation', () => {
  it('prevents an obsolete selected-attribution query from refetching', async () => {
    const focused = {
      id: 'focused',
      criticality: 0,
      packageName: 'matching-package',
      preSelected: true,
    };
    const matching = {
      ...focused,
      id: 'matching',
      preSelected: undefined,
    };
    await initializeDbWithTestData({
      resources: pathsToResources(['/file']),
      manualAttributions: {
        attributions: { focused, matching },
        resourcesToAttributions: { '/file': ['focused', 'matching'] },
        attributionsToResources: {},
      },
    });
    setDatabaseInitialized(true);

    const store = createAppStore();
    store.dispatch(setSelectedAttributionId(focused.id));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { result } = renderHook(
      () => {
        const handleFocusedAttributionOutcome =
          useFocusedAttributionOutcomeBeforeInvalidation();
        return {
          mutation: backend.updateOrMatchAttributions.useMutation({
            onBeforeInvalidation: handleFocusedAttributionOutcome,
          }),
          selectedAttribution: useSelectedAttribution(),
        };
      },
      {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          </Provider>
        ),
      },
    );

    await waitFor(() =>
      expect(result.current.selectedAttribution.packageInfo).toMatchObject(
        focused,
      ),
    );
    await act(async () => {
      await result.current.mutation.mutateAsync({
        attributions: { focused },
        focusedAttributionUuid: focused.id,
      });
    });

    expect(getSelectedAttributionId(store.getState())).toBe(matching.id);
    expect(errorSpy).not.toHaveBeenCalledWith(
      'Failed to invalidate mutation queries.',
      expect.anything(),
    );
    errorSpy.mockRestore();
  });
});
