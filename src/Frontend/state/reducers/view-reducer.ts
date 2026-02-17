// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExportType, FileFormatInfo } from '../../../shared/shared-types';
import { View } from '../../enums/enums';
import { PopupInfo } from '../../types/types';
import { invalidateAllQueries } from '../../util/backendClient';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_EXPORT_FILE_REQUEST,
  ACTION_SET_IMPORT_FILE_REQUEST,
  ACTION_SET_MERGE_REQUEST,
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
  importFileRequest: FileFormatInfo | null;
  mergeRequest: FileFormatInfo | null;
  exportFileRequest: ExportType | null;
}

const initialViewState: ViewState = {
  view: View.Audit,
  targetView: null,
  popupInfo: [],
  openFileRequest: false,
  importFileRequest: null,
  mergeRequest: null,
  exportFileRequest: null,
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
      return {
        ...state,
        popupInfo: state.popupInfo
          .map((popupInfo) => popupInfo.popup)
          .includes(action.payload.popup)
          ? state.popupInfo
          : state.popupInfo.concat(action.payload),
      };
    case ACTION_SET_OPEN_FILE_REQUEST:
      invalidateAllQueries();
      return {
        ...state,
        openFileRequest: action.payload,
      };
    case ACTION_SET_IMPORT_FILE_REQUEST:
      return {
        ...state,
        importFileRequest: action.payload,
      };
    case ACTION_SET_MERGE_REQUEST:
      return {
        ...state,
        mergeRequest: action.payload,
      };
    case ACTION_SET_EXPORT_FILE_REQUEST:
      return {
        ...state,
        exportFileRequest: action.payload,
      };
    default:
      return state;
  }
}
