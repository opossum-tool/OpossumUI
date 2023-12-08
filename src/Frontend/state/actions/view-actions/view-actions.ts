// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo } from '../../../../shared/shared-types';
import { FilterType, PopupType, View } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { State } from '../../../types/types';
import {
  getDisplayPackageInfoOfDisplayedPackage,
  getDisplayPackageInfoOfSelectedAttributionInAttributionView,
} from '../../selectors/all-views-resource-selectors';
import { getSelectedView } from '../../selectors/view-selector';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { setTemporaryDisplayPackageInfo } from '../resource-actions/all-views-simple-actions';
import { setMultiSelectSelectedAttributionIds } from '../resource-actions/attribution-view-simple-actions';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_QA_MODE,
  ACTION_SET_SHOW_NO_SIGNALS_LOCATED_MESSAGE,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ACTION_UPDATE_ACTIVE_FILTERS,
  ClosePopupAction,
  OpenPopupAction,
  ResetViewStateAction,
  SetQAModeAction,
  SetShowNoSignalsLocatedMessage,
  SetTargetView,
  SetView,
  UpdateActiveFilters,
} from './types';

export function resetViewState(): ResetViewStateAction {
  return { type: ACTION_RESET_VIEW_STATE };
}

export function navigateToView(view: View): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (getSelectedView(getState()) === view) {
      return;
    }

    dispatch(setTargetView(null));
    dispatch(setView(view));
    dispatch(setMultiSelectSelectedAttributionIds([]));

    const updatedTemporaryDisplayPackageInfo: DisplayPackageInfo =
      (view === View.Audit
        ? getDisplayPackageInfoOfDisplayedPackage(getState())
        : getDisplayPackageInfoOfSelectedAttributionInAttributionView(
            getState(),
          )) || EMPTY_DISPLAY_PACKAGE_INFO;
    dispatch(
      setTemporaryDisplayPackageInfo(updatedTemporaryDisplayPackageInfo),
    );
  };
}

export function setView(view: View): SetView {
  return {
    type: ACTION_SET_VIEW,
    payload: view,
  };
}

export function setTargetView(targetView: View | null): SetTargetView {
  return {
    type: ACTION_SET_TARGET_VIEW,
    payload: targetView,
  };
}

export function openPopup(
  popup: PopupType,
  attributionId?: string,
): OpenPopupAction {
  return {
    type: ACTION_OPEN_POPUP,
    payload: {
      popup,
      attributionId,
    },
  };
}

export function closePopup(): ClosePopupAction {
  return { type: ACTION_CLOSE_POPUP };
}

export function updateActiveFilters(
  filterType: FilterType,
): UpdateActiveFilters {
  return {
    type: ACTION_UPDATE_ACTIVE_FILTERS,
    payload: filterType,
  };
}

export function setShowNoSignalsLocatedMessage(
  showMessage: boolean,
): SetShowNoSignalsLocatedMessage {
  return {
    type: ACTION_SET_SHOW_NO_SIGNALS_LOCATED_MESSAGE,
    payload: showMessage,
  };
}

export function setQAMode(qaMode: boolean): SetQAModeAction {
  return { type: ACTION_SET_QA_MODE, payload: qaMode };
}
