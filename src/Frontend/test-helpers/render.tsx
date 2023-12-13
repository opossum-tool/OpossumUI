// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { renderHook as nativeRenderHook, render } from '@testing-library/react';
import { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { VirtuosoMockContext } from 'react-virtuoso';

import { Action, createAppStore } from '../state/configure-store';

export function renderComponent(
  component: ReactElement,
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
          <VirtuosoMockContext.Provider
            value={{ itemHeight: 200, viewportHeight: 600 }}
          >
            {children}
          </VirtuosoMockContext.Provider>
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
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
      initialProps,
    }),
    store,
  };
}
