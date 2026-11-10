// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { configureStore } from '@reduxjs/toolkit';

import { isProductionBuild } from '../util/environment';
import { reducer } from './reducer';
import type { AppThunkAction } from './types';

type Store = ReturnType<typeof createAppStore>;
export type Action = AppThunkAction | Parameters<Store['dispatch']>[0];

export function createAppStore() {
  return configureStore({
    reducer,
    devTools: !isProductionBuild(),
  });
}
