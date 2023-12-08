// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isFunction } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setVariable } from '../state/actions/variables-actions/variables-actions';
import { useAppStore } from '../state/hooks';
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
): [T, (newValue: T | ((prev: T) => T)) => void] {
  const dispatch = useDispatch();
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
      (newValue: T | ((prev: T) => T)) => {
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
