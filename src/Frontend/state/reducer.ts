// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { combineReducers } from '@reduxjs/toolkit';

import { resourceState } from './reducers/resource-reducer';
import { userSettingsState } from './reducers/user-settings-reducer';
import { variablesState } from './reducers/variables-reducer';
import { viewState } from './reducers/view-reducer';

export const reducer = combineReducers({
  viewState,
  resourceState,
  variablesState,
  userSettingsState,
});
