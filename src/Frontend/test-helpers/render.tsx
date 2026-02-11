// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook as nativeRenderHook, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { VirtuosoMockContext } from 'react-virtuoso';

import { initializeDb } from '../../ElectronBackend/db/initializeDb';
import { ParsedFileContent } from '../../shared/shared-types';
import { loadFromFile } from '../state/actions/resource-actions/load-actions';
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

export async function createTestStore(data?: ParsedFileContent) {
  if (data) {
    await initializeDb(data);
  }
  const store = createAppStore();
  if (data) {
    store.dispatch(loadFromFile(data));
  }
  return store;
}

export async function renderComponent(
  component: React.ReactElement<unknown>,
  {
    actions,
    data,
  }: {
    actions?: Array<Action>;
    data?: ParsedFileContent;
  } = {},
) {
  const store = await createTestStore(data);
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

export async function renderHook<P, R>(
  callback: (props: P) => R,
  {
    actions,
    initialProps,
    data,
  }: {
    initialProps?: P;
    actions?: Array<Action>;
    data?: ParsedFileContent;
  } = {},
) {
  const store = await createTestStore(data);
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
