// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { View } from '../../enums/enums';
import { PopupInfo } from '../../types/types';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_OPEN_FILE_REQUEST,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ViewAction,
} from '../actions/view-actions/types';

export interface ViewState {
  view: View;
  targetView: View | null;
  popupInfo: Array<PopupInfo>;
  openFileRequest: boolean;
}

export const initialViewState: ViewState = {
  view: View.Audit,
  targetView: null,
  popupInfo: [],
  openFileRequest: false,
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
    case ACTION_SET_OPEN_FILE_REQUEST:
      return {
        ...state,
        openFileRequest: action.payload,
      };
    default:
      return state;
  }
}
