// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { omit } from '../../util/lodash-extension-utils';
import { ACTION_RESET_RESOURCE_STATE } from '../actions/resource-actions/types';
import { SET_VARIABLE } from '../actions/variables-actions/types';
import { VariablesAction } from '../actions/variables-actions/variables-actions';
import {
  FILTERED_ATTRIBUTIONS_AUDIT,
  FILTERED_ATTRIBUTIONS_REPORT,
  FILTERED_SIGNALS,
} from '../variables/use-filtered-data';
import { PROGRESS_DATA } from '../variables/use-progress-data';

export type VariablesState = Record<string, unknown>;

export function variablesState(
  state: VariablesState = {},
  action: VariablesAction,
): VariablesState {
  switch (action.type) {
    case ACTION_RESET_RESOURCE_STATE:
      return omit(state, [
        FILTERED_ATTRIBUTIONS_AUDIT,
        FILTERED_ATTRIBUTIONS_REPORT,
        FILTERED_SIGNALS,
        PROGRESS_DATA,
      ]);
    case SET_VARIABLE:
      return {
        ...state,
        [action.name]: action.value,
      };
    default:
      return state;
  }
}
