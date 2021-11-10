// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PopupType, View, FilterType } from '../../../enums/enums';

export const ACTION_SET_TARGET_VIEW = 'ACTION_SET_TARGET_VIEW';
export const ACTION_SET_VIEW = 'ACTION_SET_VIEW';
export const ACTION_OPEN_POPUP = 'ACTION_OPEN_POPUP';
export const ACTION_CLOSE_POPUP = 'ACTION_CLOSE_POPUP';
export const ACTION_RESET_VIEW_STATE = 'ACTION_RESET_VIEW_STATE';
export const ACTION_OPEN_POPUP_WITH_TARGET_ATTRIBUTION_ID =
  'ACTION_OPEN_POPUP_WITH_TARGET_ATTRIBUTION_ID';
export const ACTION_UPDATE_ACTIVE_FILTERS = 'ACTION_UPDATE_ACTIVE_FILTERS';

export type ViewAction =
  | SetView
  | SetTargetView
  | ClosePopupAction
  | ResetViewStateAction
  | OpenPopupAction
  | OpenPopupWithTargetAttributionIdAction
  | UpdateActiveFilters;

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

export type OpenPopupActionPopupType = Exclude<
  PopupType,
  PopupType.ConfirmDeletionPopup | PopupType.ConfirmDeletionGloballyPopup
>;

export interface OpenPopupAction {
  type: typeof ACTION_OPEN_POPUP;
  payload: OpenPopupActionPopupType;
}

export interface UpdateActiveFilters {
  type: typeof ACTION_UPDATE_ACTIVE_FILTERS;
  payload: FilterType;
}

interface OpenPopupWithTargetAttributionIdActionPayload {
  popupType: PopupType;
  attributionId: string;
}

export interface OpenPopupWithTargetAttributionIdAction {
  type: typeof ACTION_OPEN_POPUP_WITH_TARGET_ATTRIBUTION_ID;
  payload: OpenPopupWithTargetAttributionIdActionPayload;
}
