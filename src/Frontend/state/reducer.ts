// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { combineReducers } from 'redux';
import { resourceState } from './reducers/resource-reducer';
import { viewState } from './reducers/view-reducer';

export const reducer = combineReducers({
  viewState,
  resourceState,
});
