// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { View, FilterType } from '../../enums/enums';
import { PopupInfo } from '../../types/types';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ACTION_UPDATE_ACTIVE_FILTERS,
  ViewAction,
} from '../actions/view-actions/types';
import { getUpdatedFilters } from '../helpers/set-filters';

export interface ViewState {
  view: View;
  targetView: View | null;
  popupInfo: PopupInfo | null;
  activeFilters: Set<FilterType>;
}

export const initialViewState: ViewState = {
  view: View.Audit,
  targetView: null,
  popupInfo: null,
  activeFilters: new Set<FilterType>(),
};

export function viewState(
  state: ViewState = initialViewState,
  action: ViewAction
): ViewState {
  switch (action.type) {
    case ACTION_RESET_VIEW_STATE:
      return initialViewState;
    case ACTION_SET_VIEW:
      return {
        ...state,
        view: action.payload,
      };
    case ACTION_SET_TARGET_VIEW:
      return {
        ...state,
        targetView: action.payload,
      };
    case ACTION_CLOSE_POPUP:
      return {
        ...state,
        popupInfo: null,
      };
    case ACTION_OPEN_POPUP:
      return {
        ...state,
        popupInfo: action.payload,
      };
    case ACTION_UPDATE_ACTIVE_FILTERS:
      return {
        ...state,
        activeFilters: getUpdatedFilters(state.activeFilters, action.payload),
      };
    default:
      return state;
  }
}
