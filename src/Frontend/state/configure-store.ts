// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { composeWithDevToolsDevelopmentOnly } from '@redux-devtools/extension';
import {
  applyMiddleware,
  legacy_createStore as createStore,
  Store,
} from 'redux';
import thunk from 'redux-thunk';

import { reducer } from './reducer';

export function createAppStore(): Store {
  return createStore(
    reducer,
    composeWithDevToolsDevelopmentOnly(applyMiddleware(thunk)),
  );
}
