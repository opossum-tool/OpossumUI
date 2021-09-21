// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { EnhancedStore } from '@reduxjs/toolkit';
import { render, RenderResult } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { AnyAction, Middleware, Store } from 'redux';
import { SimpleThunkAction } from '../state/actions/types';
import { createAppStore } from '../state/configure-store';
import { State } from '../types/types';

export type EnhancedTestStore = EnhancedStore<
  State, // @ts-ignore
  SimpleThunkAction | AnyAction,
  [Middleware]
>;

interface RenderResultWithStore extends RenderResult {
  store: EnhancedTestStore;
}

export function createTestAppStore(): EnhancedTestStore {
  return createAppStore() as EnhancedTestStore;
}

export const renderComponentWithStore = (
  component: ReactElement,
  { store = createTestAppStore(), ...renderOptions } = {}
): RenderResultWithStore => {
  const Wrapper: React.FC = ({ children }) => {
    return <Provider store={store as Store}>{children}</Provider>;
  };
  // @ts-ignore
  return {
    store,
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
  };
};
