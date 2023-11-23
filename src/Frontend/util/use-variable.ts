// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setVariable } from '../state/actions/variables-actions/variables-actions';
import { State } from '../types/types';

/**
 * Similar to `useState` but persists the value in the redux store.
 * @param name The name of the variable in the redux store.
 * @param initialValue The initial value of the variable.
 * @returns A tuple containing the current value and a setter function.
 */
export function useVariable<T>(
  name: string,
  initialValue: T,
): [T, (newValue: T) => void] {
  const dispatch = useDispatch();

  return [
    useSelector<State, T>((state) => {
      if (name in state.variablesState) {
        return state.variablesState[name] as T;
      }

      return initialValue;
    }),
    useCallback(
      (value: T) => {
        dispatch(setVariable(name, value));
      },
      [dispatch, name],
    ),
  ];
}
