// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Action, ThunkAction, ThunkDispatch } from '@reduxjs/toolkit';

import { State } from '../types/types';

export type AppThunkAction = ThunkAction<void, State, unknown, Action<string>>;
export type AsyncAppThunkAction = ThunkAction<
  Promise<void>,
  State,
  unknown,
  Action<string>
>;

export type AppThunkDispatch = ThunkDispatch<State, unknown, Action>;
