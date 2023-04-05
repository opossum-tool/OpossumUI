// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  MergedPackageInfo,
} from '../../../../shared/shared-types';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import { PanelPackage, State } from '../../../types/types';
import { PackagePanelTitle, View } from '../../../enums/enums';
import { getSelectedView, getTargetView } from '../../selectors/view-selector';
import {
  getManualData,
  getPackageInfoOfSelectedAttribution,
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
import { setTemporaryPackageInfo } from './all-views-simple-actions';
import {
  getAttributionOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getSelectedResourceId,
  getTargetDisplayedPackage,
  getTargetSelectedResourceId,
} from '../../selectors/audit-view-resource-selectors';
import { getTargetSelectedAttributionId } from '../../selectors/attribution-view-resource-selectors';

export function resetTemporaryPackageInfo(): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const view: View = getSelectedView(getState());

    switch (view) {
      case View.Audit:
        dispatch(
          setTemporaryPackageInfo(
            getAttributionOfDisplayedPackageInManualPanel(getState()) || {}
          )
        );
        break;
      case View.Attribution:
        dispatch(
          setTemporaryPackageInfo(
            getPackageInfoOfSelectedAttribution(getState()) || {}
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
          setDisplayedPackageAndResetTemporaryPackageInfo(
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

export function setDisplayedPackageAndResetTemporaryPackageInfo(
  panelPackage: PanelPackage,
  attribution?: MergedPackageInfo
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setDisplayedPackage(panelPackage));
    dispatch(
      attribution
        ? setTemporaryPackageInfo(attribution)
        : resetTemporaryPackageInfo()
    );
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
