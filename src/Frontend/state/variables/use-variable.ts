// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isFunction } from 'lodash';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { State } from '../../types/types';
import { setVariable } from '../actions/variables-actions/variables-actions';
import { useAppDispatch, useAppStore } from '../hooks';

/**
 * Similar to `useState` but persists the value in the redux store.
 * @param name The name of the variable in the redux store.
 * @param initialValue The initial value of the variable.
 * @returns A tuple containing the current value and a setter function.
 */
export function useVariable<T>(
  name: string,
  initialValue: T,
): [T, (newValue: T | ((prev: T) => T | Promise<T>)) => void] {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const getValue = useCallback(
    (state: State) => {
      if (name in state.variablesState) {
        return state.variablesState[name] as T;
      }

      return initialValue;
    },
    [initialValue, name],
  );

  return [
    useSelector<State, T>(getValue),
    useCallback(
      (newValue: T | ((prev: T) => T | Promise<T>)) => {
        dispatch(
          setVariable(
            name,
            isFunction(newValue)
              ? newValue(getValue(store.getState()))
              : newValue,
          ),
        );
      },
      [dispatch, getValue, name, store],
    ),
  ];
}
