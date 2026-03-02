// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { omit } from '../../util/lodash-extension-utils';
import { ACTION_RESET_RESOURCE_STATE } from '../actions/resource-actions/types';
import { SET_VARIABLE } from '../actions/variables-actions/types';
import { VariablesAction } from '../actions/variables-actions/variables-actions';
import {
  EXTERNAL_ATTRIBUTION_FILTERS,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  MANUAL_ATTRIBUTION_FILTERS_REPORT,
} from '../variables/use-filters';

export type VariablesState = Record<string, unknown>;

export function variablesState(
  state: VariablesState = {},
  action: VariablesAction,
): VariablesState {
  switch (action.type) {
    case ACTION_RESET_RESOURCE_STATE:
      return omit(state, [
        MANUAL_ATTRIBUTION_FILTERS_AUDIT,
        MANUAL_ATTRIBUTION_FILTERS_REPORT,
        EXTERNAL_ATTRIBUTION_FILTERS,
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
