// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { ReactElement, StrictMode } from 'react';
import { Provider } from 'react-redux';

import { createAppStore } from '../../state/configure-store';
import { App } from '../App/App';

dayjs.extend(localizedFormat);

const store = createAppStore();
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

export function AppContainer(): ReactElement {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StrictMode>
          <App />
        </StrictMode>
      </QueryClientProvider>
    </Provider>
  );
}
