// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { View } from '../../../enums/enums';

export const ACTION_SET_TARGET_VIEW = 'ACTION_SET_TARGET_VIEW';
export const ACTION_SET_VIEW = 'ACTION_SET_VIEW';
export const ACTION_OPEN_NOT_SAVED_POPUP = 'ACTION_OPEN_NOT_SAVED_POPUP';
export const ACTION_OPEN_ERROR_POPUP = 'ACTION_OPEN_ERROR_POPUP';
export const ACTION_OPEN_FILE_SEARCH_POPUP = 'ACTION_OPEN_FILE_SEARCH_POPUP';
export const ACTION_OPEN_PROJECT_METADATA_POPUP =
  'ACTION_OPEN_PROJECT_METADATA_POPUP';
export const ACTION_CLOSE_POPUP = 'ACTION_CLOSE_POPUP';
export const ACTION_RESET_VIEW_STATE = 'ACTION_RESET_VIEW_STATE';

export type ViewAction =
  | SetView
  | SetTargetView
  | OpenNotSavedPopupAction
  | OpenErrorPopupAction
  | ClosePopupAction
  | ResetViewStateAction
  | OpenFileSearchPopupAction
  | OpenProjectMetadataPopupAction;

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

export interface OpenNotSavedPopupAction {
  type: typeof ACTION_OPEN_NOT_SAVED_POPUP;
}

export interface OpenErrorPopupAction {
  type: typeof ACTION_OPEN_ERROR_POPUP;
}

export interface OpenFileSearchPopupAction {
  type: typeof ACTION_OPEN_FILE_SEARCH_POPUP;
}

export interface OpenProjectMetadataPopupAction {
  type: typeof ACTION_OPEN_PROJECT_METADATA_POPUP;
}

export interface ClosePopupAction {
  type: typeof ACTION_CLOSE_POPUP;
}
