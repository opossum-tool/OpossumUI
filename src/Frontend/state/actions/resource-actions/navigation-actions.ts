// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionData } from '../../../../shared/shared-types';
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
import { setSelectedAttributionId } from './attribution-view-simple-actions';
import {
  setDisplayedPackage,
  setExpandedIds,
  setSelectedResourceId,
} from './audit-view-simple-actions';
import { setTemporaryPackageInfo } from './all-views-simple-actions';
import {
  getAttributionOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getSelectedResourceId,
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
            getAttributionOfDisplayedPackageInManualPanel(getState())
          )
        );
        break;
      case View.Attribution:
        dispatch(
          setTemporaryPackageInfo(
            getPackageInfoOfSelectedAttribution(getState())
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
    if (selectedView === View.Audit) {
      const targetSelectedResourceId = getTargetSelectedResourceId(getState());
      if (targetSelectedResourceId) {
        dispatch(setSelectedResourceId(targetSelectedResourceId));
      }
    } else if (selectedView === View.Attribution) {
      const targetSelectedAttributionId = getTargetSelectedAttributionId(
        getState()
      );
      if (targetSelectedAttributionId) {
        dispatch(setSelectedAttributionId(targetSelectedAttributionId));
        if (targetSelectedView === View.Audit) {
          dispatch(
            setSelectedResourceId(getTargetSelectedResourceId(getState()))
          );
        }
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
  panelPackage: PanelPackage
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setDisplayedPackage(panelPackage));
    dispatch(resetTemporaryPackageInfo());
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
