// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook as nativeRenderHook, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { VirtuosoMockContext } from 'react-virtuoso';

import { Action, createAppStore } from '../state/configure-store';

function makeReactQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export function renderComponent(
  component: React.ReactElement<unknown>,
  {
    actions,
  }: {
    actions?: Array<Action>;
  } = {},
) {
  const store = createAppStore();
  actions?.forEach(store.dispatch);

  return {
    store,
    ...render(component, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <QueryClientProvider client={makeReactQueryClient()}>
            <VirtuosoMockContext
              value={{ itemHeight: 40, viewportHeight: 1200 }}
            >
              {children}
            </VirtuosoMockContext>
          </QueryClientProvider>
        </Provider>
      ),
    }),
  };
}

export function renderHook<P, R>(
  callback: (props: P) => R,
  {
    actions,
    initialProps,
  }: {
    initialProps?: P;
    actions?: Array<Action>;
  } = {},
) {
  const store = createAppStore();
  actions?.forEach(store.dispatch);

  return {
    ...nativeRenderHook(callback, {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <QueryClientProvider client={makeReactQueryClient()}>
            {children}
          </QueryClientProvider>
        </Provider>
      ),
      initialProps,
    }),
    store,
  };
}
