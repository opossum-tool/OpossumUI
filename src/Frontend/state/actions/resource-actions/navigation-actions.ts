// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionData } from '../../../../shared/shared-types';
import { PackagePanelTitle, View } from '../../../enums/enums';
import {
  ADD_NEW_ATTRIBUTION_BUTTON_ID,
  EMPTY_DISPLAY_PACKAGE_INFO,
} from '../../../shared-constants';
import { PanelPackage, State } from '../../../types/types';
import { doNothing } from '../../../util/do-nothing';
import { isExternalPackagePanel } from '../../../util/is-external-package-panel';
import { getParents } from '../../helpers/get-parents';
import {
  getDisplayPackageInfoOfSelectedAttributionInAttributionView,
  getManualData,
} from '../../selectors/all-views-resource-selectors';
import { getDisplayedPackage } from '../../selectors/all-views-resource-selectors';
import { getDisplayPackageInfoOfDisplayedPackage } from '../../selectors/all-views-resource-selectors';
import { getTargetSelectedAttributionId } from '../../selectors/attribution-view-resource-selectors';
import {
  getSelectedResourceId,
  getTargetDisplayedPackage,
  getTargetSelectedResourceId,
} from '../../selectors/audit-view-resource-selectors';
import { getSelectedView, getTargetView } from '../../selectors/view-selector';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { navigateToView } from '../view-actions/view-actions';
import { setTemporaryDisplayPackageInfo } from './all-views-simple-actions';
import {
  setSelectedAttributionId,
  setTargetSelectedAttributionId,
} from './attribution-view-simple-actions';
import {
  setDisplayedPackage,
  setExpandedIds,
  setSelectedResourceId,
  setTargetDisplayedPackage,
  setTargetSelectedResourceId,
} from './audit-view-simple-actions';

export function resetTemporaryDisplayPackageInfo(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const view: View = getSelectedView(getState());

    switch (view) {
      case View.Audit:
        dispatch(
          setTemporaryDisplayPackageInfo(
            getDisplayPackageInfoOfDisplayedPackage(getState()) ||
              EMPTY_DISPLAY_PACKAGE_INFO,
          ),
        );
        break;
      case View.Attribution:
        dispatch(
          setTemporaryDisplayPackageInfo(
            getDisplayPackageInfoOfSelectedAttributionInAttributionView(
              getState(),
            ) || EMPTY_DISPLAY_PACKAGE_INFO,
          ),
        );
        break;
      default:
        doNothing();
    }
  };
}

export function setSelectedResourceOrAttributionIdToTargetValue(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedView = getSelectedView(getState());
    const targetSelectedView = getTargetView(getState());
    const targetSelectedResourceId = getTargetSelectedResourceId(getState());
    if (selectedView === View.Audit) {
      const targetDisplayedPackage = getTargetDisplayedPackage(getState());
      if (targetDisplayedPackage) {
        dispatch(
          setDisplayedPackageAndResetTemporaryDisplayPackageInfo(
            targetDisplayedPackage,
          ),
        );
        dispatch(setTargetDisplayedPackage(null));
      }
      if (targetSelectedResourceId) {
        dispatch(setSelectedResourceId(targetSelectedResourceId));
        dispatch(setTargetSelectedResourceId(null));
      }
    } else if (selectedView === View.Attribution) {
      const targetSelectedAttributionId =
        getTargetSelectedAttributionId(getState());
      if (targetSelectedAttributionId) {
        dispatch(setSelectedAttributionId(targetSelectedAttributionId));
        dispatch(setTargetSelectedAttributionId(null));
      }
      if (targetSelectedView === View.Audit && targetSelectedResourceId) {
        dispatch(setSelectedResourceId(targetSelectedResourceId));
        dispatch(setTargetSelectedResourceId(null));
      }
    }
  };
}

export function openResourceInResourceBrowser(
  resourceId: string,
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setExpandedIds(getParents(resourceId).concat([resourceId])));
    dispatch(setSelectedResourceId(resourceId));
    dispatch(navigateToView(View.Audit));
  };
}

export function setDisplayedPackageAndResetTemporaryDisplayPackageInfo(
  panelPackage: PanelPackage,
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setDisplayedPackage(panelPackage));
    dispatch(resetTemporaryDisplayPackageInfo());
  };
}

export function resetSelectedPackagePanelIfContainedAttributionWasRemoved(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId: string = getSelectedResourceId(getState());
    const manualData: AttributionData = getManualData(getState());
    const attributionIdsOfResource: Array<string> =
      (selectedResourceId &&
        manualData.resourcesToAttributions[selectedResourceId]) ||
      [];

    const displayedPanelPackage = getDisplayedPackage(getState());
    const selectedAttributionId =
      displayedPanelPackage?.displayPackageInfo.attributionIds[0] || '';
    const panelTitle = displayedPanelPackage?.panel;
    if (
      panelTitle &&
      !isExternalPackagePanel(panelTitle) &&
      !attributionIdsOfResource.includes(selectedAttributionId)
    ) {
      dispatch(
        setDisplayedPackage({
          panel: PackagePanelTitle.ManualPackages,
          packageCardId: ADD_NEW_ATTRIBUTION_BUTTON_ID,
          displayPackageInfo: EMPTY_DISPLAY_PACKAGE_INFO,
        }),
      );
    }
  };
}
