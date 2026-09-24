// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  renderHook as nativeRenderHook,
  render,
  type RenderOptions,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { VirtuosoMockContext } from 'react-virtuoso';

import type { ParsedFileContent } from '../../shared/shared-types';
import { setupBackendIntegration } from '../../testing/backend-integration';
import { theme } from '../Components/App/App.style';
import { type Action, createAppStore } from '../state/configure-store';
import { setDatabaseInitialized } from '../util/backendClient';

function makeReactQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function makeProviderWrapper(
  store: Awaited<ReturnType<typeof createTestStore>>,
) {
  const queryClient = makeReactQueryClient();
  return function ProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <VirtuosoMockContext value={{ itemHeight: 40, viewportHeight: 1200 }}>
            {children}
          </VirtuosoMockContext>
        </QueryClientProvider>
      </Provider>
    );
  };
}

export async function createTestStore(data?: ParsedFileContent) {
  if (data) {
    await setupBackendIntegration(data);
    setDatabaseInitialized(true);
  }
  return createAppStore();
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
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <QueryClientProvider client={makeReactQueryClient()}>
              <VirtuosoMockContext
                value={{ itemHeight: 40, viewportHeight: 1200 }}
              >
                {children}
              </VirtuosoMockContext>
            </QueryClientProvider>
          </Provider>
        </ThemeProvider>
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
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <QueryClientProvider client={makeReactQueryClient()}>
              {children}
            </QueryClientProvider>
          </Provider>
        </ThemeProvider>
      ),
      initialProps,
    }),
    store,
  };
}

export function renderWithTheme(
  component: React.ReactElement<unknown>,
  options?: RenderOptions,
) {
  return render(component, {
    ...options,
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    ),
  });
}
