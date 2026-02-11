// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { StrictMode } from 'react';
import { Provider } from 'react-redux';

import { createAppStore } from '../../state/configure-store';
import { App } from '../App/App';
import { Toaster } from '../Toaster/Toaster';
import { queryClient } from './queryClient';

dayjs.extend(localizedFormat);

const store = createAppStore();

export function AppContainer() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StrictMode>
          <App />
          <Toaster />
        </StrictMode>
      </QueryClientProvider>
    </Provider>
  );
}
