// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle, PopupType, View } from '../../../enums/enums';
import { State } from '../../../types/types';
import {
  getAttributionIdToSaveTo,
  getManualAttributions,
  getPackageInfoOfSelected,
  getTemporaryPackageInfo,
  wereTemporaryPackageInfoModified,
} from '../../selectors/all-views-resource-selectors';
import { getTargetView } from '../../selectors/view-selector';
import {
  openResourceInResourceBrowser,
  setDisplayedPackageAndResetTemporaryPackageInfo,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../resource-actions/navigation-actions';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import {
  closePopup,
  navigateToView,
  openPopup,
  setTargetView,
} from '../view-actions/view-actions';
import {
  savePackageInfo,
  unlinkAttributionAndSavePackageInfo,
} from '../resource-actions/save-actions';
import {
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from '../resource-actions/attribution-view-simple-actions';
import {
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../resource-actions/audit-view-simple-actions';
import { setTemporaryPackageInfo } from '../resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../selectors/audit-view-resource-selectors';

export function navigateToSelectedPathOrOpenUnsavedPopup(
  resourcePath: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(setTargetSelectedResourceId(resourcePath));
      dispatch(setTargetView(View.Audit));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(openResourceInResourceBrowser(resourcePath));
    }
  };
}

export function changeSelectedAttributionIdOrOpenUnsavedPopup(
  attributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const manualAttributions = getManualAttributions(getState());
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(setTargetSelectedAttributionId(attributionId));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(setSelectedAttributionId(attributionId));
      dispatch(setTemporaryPackageInfo(manualAttributions[attributionId]));
    }
  };
}

export function setViewOrOpenUnsavedPopup(selectedView: View): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(setTargetView(selectedView));
      dispatch(setTargetSelectedResourceId(getSelectedResourceId(getState())));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(navigateToView(selectedView));
    }
  };
}

export function setSelectedResourceIdOrOpenUnsavedPopup(
  resourceId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(setTargetSelectedResourceId(resourceId));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(setSelectedResourceId(resourceId));
    }
  };
}

export function selectAttributionInAccordionPanelOrOpenUnsavedPopup(
  packagePanelTitle: PackagePanelTitle,
  attributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(
        setDisplayedPackageAndResetTemporaryPackageInfo({
          panel: packagePanelTitle,
          attributionId,
        })
      );
    }
  };
}

export function selectAttributionInManualPackagePanelOrOpenUnsavedPopup(
  packagePanelTitle: PackagePanelTitle,
  attributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      dispatch(
        setDisplayedPackageAndResetTemporaryPackageInfo({
          panel: packagePanelTitle,
          attributionId,
        })
      );
    }
  };
}

export function unlinkAttributionAndSavePackageInfoAndNavigateToTargetView(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId = getSelectedResourceId(getState());
    const attributionId = getAttributionIdToSaveTo(getState()) as string;
    const temporaryPackageInfo = getTemporaryPackageInfo(getState());

    dispatch(
      unlinkAttributionAndSavePackageInfo(
        selectedResourceId,
        attributionId,
        temporaryPackageInfo
      )
    );
    dispatch(navigateToTargetResourceOrAttribution());
  };
}

export function saveTemporaryPackageInfoAndNavigateToTargetView(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId = getSelectedResourceId(getState());
    const attributionId = getAttributionIdToSaveTo(getState());
    const temporaryPackageInfo = getTemporaryPackageInfo(getState());

    dispatch(
      savePackageInfo(selectedResourceId, attributionId, temporaryPackageInfo)
    );
    dispatch(navigateToTargetResourceOrAttribution());
  };
}

export function navigateToTargetResourceOrAttribution(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const targetView = getTargetView(getState());

    dispatch(setSelectedResourceOrAttributionIdToTargetValue());
    if (targetView) {
      dispatch(navigateToView(targetView));
    }
    dispatch(setTemporaryPackageInfo(getPackageInfoOfSelected(getState())));

    dispatch(closePopup());
  };
}

export function closeEditAttributionPopupOrOpenUnsavedPopup(
  popupAttributionId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (wereTemporaryPackageInfoModified(getState())) {
      dispatch(openPopup(PopupType.NotSavedPopup, popupAttributionId));
    } else {
      dispatch(closePopup());
    }
  };
}
