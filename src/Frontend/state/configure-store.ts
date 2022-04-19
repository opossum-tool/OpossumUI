// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { reducer } from './reducer';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import {
  applyMiddleware,
  legacy_createStore as createStore,
  Store,
} from 'redux';
import thunk from 'redux-thunk';

export function createAppStore(): Store {
  return createStore(reducer, composeWithDevTools(applyMiddleware(thunk)));
}
