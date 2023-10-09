// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { FilterType, View } from '../../enums/enums';
import { PopupInfo } from '../../types/types';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_IS_LOADING,
  ACTION_SET_QA_MODE,
  ACTION_SET_SHOW_NO_SIGNALS_LOCATED_MESSAGE,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ACTION_UPDATE_ACTIVE_FILTERS,
  ViewAction,
} from '../actions/view-actions/types';
import { getUpdatedFilters } from '../helpers/set-filters';

export interface ViewState {
  view: View;
  targetView: View | null;
  popupInfo: Array<PopupInfo>;
  activeFilters: Set<FilterType>;
  isLoading: boolean;
  showNoSignalsLocatedMessage: boolean;
  qaMode: boolean;
}

export const initialViewState: ViewState = {
  view: View.Audit,
  targetView: null,
  popupInfo: [],
  activeFilters: new Set<FilterType>(),
  isLoading: false,
  showNoSignalsLocatedMessage: false,
  qaMode: false,
};

export function viewState(
  state: ViewState = initialViewState,
  action: ViewAction,
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
        popupInfo: state.popupInfo.slice(0, -1),
      };
    case ACTION_OPEN_POPUP:
      const openPopups = state.popupInfo.map((popupInfo) => popupInfo.popup);
      const newPopupInfo = openPopups.includes(action.payload.popup)
        ? state.popupInfo
        : state.popupInfo.concat(action.payload);
      return {
        ...state,
        popupInfo: newPopupInfo,
      };
    case ACTION_UPDATE_ACTIVE_FILTERS:
      return {
        ...state,
        activeFilters: getUpdatedFilters(state.activeFilters, action.payload),
      };
    case ACTION_SET_IS_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case ACTION_SET_SHOW_NO_SIGNALS_LOCATED_MESSAGE:
      return {
        ...state,
        showNoSignalsLocatedMessage: action.payload,
      };
    case ACTION_SET_QA_MODE:
      return {
        ...state,
        qaMode: action.payload,
      };
    default:
      return state;
  }
}
