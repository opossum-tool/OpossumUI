// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsFilterType, View } from '../../../enums/enums';
import { PopupInfo } from '../../../types/types';

export const ACTION_SET_TARGET_VIEW = 'ACTION_SET_TARGET_VIEW';
export const ACTION_SET_VIEW = 'ACTION_SET_VIEW';
export const ACTION_OPEN_POPUP = 'ACTION_OPEN_POPUP';
export const ACTION_CLOSE_POPUP = 'ACTION_CLOSE_POPUP';
export const ACTION_RESET_VIEW_STATE = 'ACTION_RESET_VIEW_STATE';
export const ACTION_UPDATE_ACTIVE_FILTERS = 'ACTION_UPDATE_ACTIVE_FILTERS';
export const ACTION_SET_IS_LOADING = 'ACTION_SET_IS_LOADING';

export type ViewAction =
  | SetView
  | SetTargetView
  | ClosePopupAction
  | ResetViewStateAction
  | OpenPopupAction
  | UpdateActiveFilters
  | SetIsLoadingAction;

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

export interface UpdateActiveFilters {
  type: typeof ACTION_UPDATE_ACTIVE_FILTERS;
  payload: AttributionsFilterType;
}

export interface SetIsLoadingAction {
  type: typeof ACTION_SET_IS_LOADING;
  payload: boolean;
}
