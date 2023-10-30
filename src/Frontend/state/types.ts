// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Action } from 'redux';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';

import { State } from '../types/types';

export type AppThunkAction = ThunkAction<void, State, unknown, Action<string>>;

export type AppThunkDispatch = ThunkDispatch<State, unknown, Action>;
