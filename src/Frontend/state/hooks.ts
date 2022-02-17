// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { State } from '../types/types';
import { AppThunkDispatch } from './types';

export const useAppDispatch = (): AppThunkDispatch =>
  useDispatch<AppThunkDispatch>();
export const useAppSelector: TypedUseSelectorHook<State> = useSelector;
