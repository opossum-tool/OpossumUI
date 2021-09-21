// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { createStore, EnhancedStore, applyMiddleware } from '@reduxjs/toolkit';
import { reducer } from './reducer';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';

export function createAppStore(): EnhancedStore {
  return createStore(reducer, composeWithDevTools(applyMiddleware(thunk)));
}
