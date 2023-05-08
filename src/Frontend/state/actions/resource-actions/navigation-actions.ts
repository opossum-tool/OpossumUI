// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  DisplayPackageInfo,
} from '../../../../shared/shared-types';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { PanelPackage, State } from '../../../types/types';
import { PackagePanelTitle, View } from '../../../enums/enums';
import { getSelectedView, getTargetView } from '../../selectors/view-selector';
import {
  getManualData,
  getDisplayPackageInfoOfSelectedAttribution,
} from '../../selectors/all-views-resource-selectors';
import { doNothing } from '../../../util/do-nothing';
import { getParents } from '../../helpers/get-parents';
import { navigateToView } from '../view-actions/view-actions';
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
import { setTemporaryDisplayPackageInfo } from './all-views-simple-actions';
import {
  getDisplayPackageInfoOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getSelectedResourceId,
  getTargetDisplayedPackage,
  getTargetSelectedResourceId,
} from '../../selectors/audit-view-resource-selectors';
import { getTargetSelectedAttributionId } from '../../selectors/attribution-view-resource-selectors';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';

export function resetTemporaryDisplayPackageInfo(
  attribution?: DisplayPackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    if (attribution) {
      dispatch(setTemporaryDisplayPackageInfo(attribution));
      return;
    }

    const view: View = getSelectedView(getState());

    switch (view) {
      case View.Audit:
        dispatch(
          setTemporaryDisplayPackageInfo(
            getDisplayPackageInfoOfDisplayedPackageInManualPanel(getState()) ||
              EMPTY_DISPLAY_PACKAGE_INFO
          )
        );
        break;
      case View.Attribution:
        dispatch(
          setTemporaryDisplayPackageInfo(
            getDisplayPackageInfoOfSelectedAttribution(getState()) ||
              EMPTY_DISPLAY_PACKAGE_INFO
          )
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
            targetDisplayedPackage
          )
        );
        dispatch(setTargetDisplayedPackage(null));
      }
      if (targetSelectedResourceId) {
        dispatch(setSelectedResourceId(targetSelectedResourceId));
        dispatch(setTargetSelectedResourceId(null));
      }
    } else if (selectedView === View.Attribution) {
      const targetSelectedAttributionId = getTargetSelectedAttributionId(
        getState()
      );
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
  resourceId: string
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setExpandedIds(getParents(resourceId).concat([resourceId])));
    dispatch(setSelectedResourceId(resourceId));
    dispatch(navigateToView(View.Audit));
  };
}

export function setDisplayedPackageAndResetTemporaryDisplayPackageInfo(
  panelPackage: PanelPackage,
  attribution?: DisplayPackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setDisplayedPackage(panelPackage));
    dispatch(resetTemporaryDisplayPackageInfo(attribution));
  };
}

export function resetSelectedPackagePanelIfContainedAttributionWasRemoved(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const selectedResourceId: string = getSelectedResourceId(getState());
    const manualData: AttributionData = getManualData(getState());
    const AttributionIdsOfResource: Array<string> =
      (selectedResourceId &&
        manualData.resourcesToAttributions[selectedResourceId]) ||
      [];

    const selectedAttributionId: string =
      getDisplayedPackage(getState())?.attributionId || '';

    if (!AttributionIdsOfResource.includes(selectedAttributionId)) {
      dispatch(
        setDisplayedPackage({
          panel: PackagePanelTitle.ManualPackages,
          attributionId: '',
        })
      );
    }
  };
}
