// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { memoize } from 'proxy-memoize';
import { useCallback } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { State } from '../types/types';
import { AppThunkDispatch } from './types';

export const useAppDispatch = useDispatch<AppThunkDispatch>;

export const useAppSelector = <T>(
  fn: (state: State) => T,
  deps: Array<unknown> = [],
): T =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useSelector<State, T>(useCallback(memoize(fn), deps));

export const useAppStore = useStore<State>;
