// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PopupType, View } from '../../enums/enums';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ACTION_SET_FOLLOW_UP_FILTER,
  ViewAction,
  ACTION_OPEN_POPUP_WITH_TARGET_ATTRIBUTION_ID,
} from '../actions/view-actions/types';

export interface ViewState {
  view: View;
  targetView: View | null;
  openPopup: PopupType | null;
  filterForFollowUp: boolean;
  targetAttributionId: string;
}

export const initialViewState: ViewState = {
  view: View.Audit,
  targetView: null,
  openPopup: null,
  filterForFollowUp: false,
  targetAttributionId: '',
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
    case ACTION_OPEN_POPUP:
      return {
        ...state,
        openPopup: action.payload,
      };
    case ACTION_SET_FOLLOW_UP_FILTER:
      return {
        ...state,
        filterForFollowUp: action.payload,
      };
    case ACTION_OPEN_POPUP_WITH_TARGET_ATTRIBUTION_ID:
      return {
        ...state,
        targetAttributionId: action.payload.attributionId,
        openPopup: action.payload.popupType,
      };
    default:
      return state;
  }
}
