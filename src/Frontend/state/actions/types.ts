// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { State } from '../../types/types';
import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';

export type SimpleThunkAction = ThunkAction<unknown, State, unknown, Action>;
export type SimpleThunkDispatch = ThunkDispatch<State, unknown, Action>;
