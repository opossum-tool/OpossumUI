// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from '../../state/configure-store';
import { App } from '../App/App';
import { QueryClient, QueryClientProvider } from 'react-query';
import { WorkersContextProvider } from '../WorkersContextProvider/WorkersContextProvider';

const store = createAppStore();
const queryClient = new QueryClient();

export function AppContainer(): ReactElement {
  return (
    <React.StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <WorkersContextProvider>
            <App />
          </WorkersContextProvider>
        </QueryClientProvider>
      </Provider>
    </React.StrictMode>
  );
}
