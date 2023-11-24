// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SET_VARIABLE } from '../actions/variables-actions/types';
import { VariablesAction } from '../actions/variables-actions/variables-actions';

export type VariablesState = Record<string, unknown>;

export function variablesState(
  state: VariablesState = {},
  action: VariablesAction,
): VariablesState {
  switch (action.type) {
    case SET_VARIABLE:
      return {
        ...state,
        [action.name]: action.value,
      };
    default:
      return state;
  }
}
