// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PopupType, View } from '../../enums/enums';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_ERROR_POPUP,
  ACTION_OPEN_FILE_SEARCH_POPUP,
  ACTION_OPEN_NOT_SAVED_POPUP,
  ACTION_OPEN_PROJECT_METADATA_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ViewAction,
} from '../actions/view-actions/types';

export interface ViewState {
  view: View;
  targetView: View | null;
  openPopup: PopupType | null;
}

export const initialViewState: ViewState = {
  view: View.Audit,
  targetView: null,
  openPopup: null,
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
        openPopup: null,
      };
    case ACTION_OPEN_NOT_SAVED_POPUP:
      return {
        ...state,
        openPopup: PopupType.NotSavedPopup,
      };
    case ACTION_OPEN_ERROR_POPUP:
      return {
        ...state,
        openPopup: PopupType.ErrorPopup,
      };
    case ACTION_OPEN_FILE_SEARCH_POPUP:
      return {
        ...state,
        openPopup: PopupType.FileSearchPopup,
      };
    case ACTION_OPEN_PROJECT_METADATA_POPUP:
      return {
        ...state,
        openPopup: PopupType.ProjectMetadataPopup,
      };
    default:
      return state;
  }
}
