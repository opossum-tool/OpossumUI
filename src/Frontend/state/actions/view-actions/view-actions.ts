// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../../shared/shared-types';
import { View } from '../../../enums/enums';
import { State } from '../../../types/types';
import { getPackageInfoOfSelectedAttribution } from '../../selectors/all-views-resource-selectors';
import { getSelectedView } from '../../selectors/view-selector';
import { SimpleThunkAction, SimpleThunkDispatch } from '../types';
import { setTemporaryPackageInfo } from '../resource-actions/all-views-simple-actions';
import { getAttributionOfDisplayedPackageInManualPanel } from '../../selectors/audit-view-resource-selectors';
import {
  ACTION_CLOSE_POPUP,
  ACTION_OPEN_ERROR_POPUP,
  ACTION_OPEN_FILE_SEARCH_POPUP,
  ACTION_OPEN_NOT_SAVED_POPUP,
  ACTION_OPEN_PROJECT_METADATA_POPUP,
  ACTION_RESET_VIEW_STATE,
  ACTION_SET_TARGET_VIEW,
  ACTION_SET_VIEW,
  ClosePopupAction,
  OpenErrorPopupAction,
  OpenFileSearchPopupAction,
  OpenNotSavedPopupAction,
  OpenProjectMetadataPopupAction,
  ResetViewStateAction,
  SetTargetView,
  SetView,
} from './types';

export function resetViewState(): ResetViewStateAction {
  return { type: ACTION_RESET_VIEW_STATE };
}

export function navigateToView(view: View): SimpleThunkAction {
  return (dispatch: SimpleThunkDispatch, getState: () => State): void => {
    if (getSelectedView(getState()) === view) {
      return;
    }

    dispatch(setTargetView(null));
    dispatch(setView(view));

    const updatedTemporaryPackageInfo: PackageInfo =
      view === View.Audit
        ? getAttributionOfDisplayedPackageInManualPanel(getState())
        : getPackageInfoOfSelectedAttribution(getState());
    dispatch(setTemporaryPackageInfo(updatedTemporaryPackageInfo));
  };
}

function setView(view: View): SetView {
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

export function openNotSavedPopup(): OpenNotSavedPopupAction {
  return { type: ACTION_OPEN_NOT_SAVED_POPUP };
}

export function openErrorPopup(): OpenErrorPopupAction {
  return { type: ACTION_OPEN_ERROR_POPUP };
}

export function openFileSearchPopup(): OpenFileSearchPopupAction {
  return { type: ACTION_OPEN_FILE_SEARCH_POPUP };
}

export function openProjectMetadataPopup(): OpenProjectMetadataPopupAction {
  return { type: ACTION_OPEN_PROJECT_METADATA_POPUP };
}

export function closePopup(): ClosePopupAction {
  return { type: ACTION_CLOSE_POPUP };
}
