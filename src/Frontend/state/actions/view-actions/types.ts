// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExportType, FileFormatInfo } from '../../../../shared/shared-types';
import { View } from '../../../enums/enums';
import { PopupInfo } from '../../../types/types';

export const ACTION_SET_TARGET_VIEW = 'ACTION_SET_TARGET_VIEW';
export const ACTION_SET_VIEW = 'ACTION_SET_VIEW';
export const ACTION_OPEN_POPUP = 'ACTION_OPEN_POPUP';
export const ACTION_CLOSE_POPUP = 'ACTION_CLOSE_POPUP';
export const ACTION_RESET_VIEW_STATE = 'ACTION_RESET_VIEW_STATE';
export const ACTION_SET_OPEN_FILE_REQUEST = 'ACTION_SET_OPEN_FILE_REQUEST';
export const ACTION_SET_IMPORT_FILE_REQUEST = 'ACTION_SET_IMPORT_FILE_REQUEST';
export const ACTION_SET_MERGE_REQUEST = 'ACTION_SET_MERGE_REQUEST';
export const ACTION_SET_EXPORT_FILE_REQUEST = 'ACTION_SET_EXPORT_FILE_REQUEST';

export type ViewAction =
  | SetView
  | SetTargetView
  | ClosePopupAction
  | ResetViewStateAction
  | OpenPopupAction
  | SetOpenFileRequestAction
  | SetImportFileRequestAction
  | SetMergeRequestAction
  | SetExportFileRequestAction;

export interface ResetViewStateAction {
  type: typeof ACTION_RESET_VIEW_STATE;
}

export interface SetTargetView {
  type: typeof ACTION_SET_TARGET_VIEW;
  payload: View | null;
}

export interface SetView {
  type: typeof ACTION_SET_VIEW;
  payload: View;
}

export interface ClosePopupAction {
  type: typeof ACTION_CLOSE_POPUP;
}

export interface OpenPopupAction {
  type: typeof ACTION_OPEN_POPUP;
  payload: PopupInfo;
}

export interface SetOpenFileRequestAction {
  type: typeof ACTION_SET_OPEN_FILE_REQUEST;
  payload: boolean;
}

export interface SetImportFileRequestAction {
  type: typeof ACTION_SET_IMPORT_FILE_REQUEST;
  payload: FileFormatInfo | null;
}

export interface SetMergeRequestAction {
  type: typeof ACTION_SET_MERGE_REQUEST;
  payload: FileFormatInfo | null;
}

export interface SetExportFileRequestAction {
  type: typeof ACTION_SET_EXPORT_FILE_REQUEST;
  payload: ExportType | null;
}
