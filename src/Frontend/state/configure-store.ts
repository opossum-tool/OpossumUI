// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  applyMiddleware,
  legacy_createStore as createStore,
  Store,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import thunk from 'redux-thunk';

import { reducer } from './reducer';

export function createAppStore(): Store {
  return createStore(reducer, composeWithDevTools(applyMiddleware(thunk)));
}
