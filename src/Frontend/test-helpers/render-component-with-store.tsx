// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, RenderResult } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { createAppStore } from '../state/configure-store';
import { AppThunkDispatch } from '../state/types';

export interface EnhancedTestStore extends Store {
  dispatch: AppThunkDispatch;
}

interface RenderResultWithStore extends RenderResult {
  store: EnhancedTestStore;
}

export function createTestAppStore(): EnhancedTestStore {
  return createAppStore();
}

export const renderComponentWithStore = (
  component: ReactElement,
  { store = createTestAppStore(), ...renderOptions } = {},
): RenderResultWithStore => {
  const Wrapper: React.FC<{ children: ReactNode | null }> = ({ children }) => {
    return <Provider store={store as Store}>{children}</Provider>;
  };
  // @ts-ignore
  return {
    store,
    ...render(component, { wrapper: Wrapper, ...renderOptions }),
  };
};
