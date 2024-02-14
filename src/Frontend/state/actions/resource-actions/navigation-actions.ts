// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { getParents } from '../../helpers/get-parents';
import {
  getPackageInfoOfSelectedAttribution,
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
} from '../../selectors/resource-selectors';
import { AppThunkAction } from '../../types';
import { setTemporaryDisplayPackageInfo } from './all-views-simple-actions';
import {
  setExpandedIds,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from './audit-view-simple-actions';

export function resetTemporaryDisplayPackageInfo(): AppThunkAction {
  return (dispatch, getState) => {
    dispatch(
      setTemporaryDisplayPackageInfo(
        getPackageInfoOfSelectedAttribution(getState()) ||
          EMPTY_DISPLAY_PACKAGE_INFO,
      ),
    );
  };
}

export function setSelectedResourceOrAttributionIdToTargetValue(): AppThunkAction {
  return (dispatch, getState) => {
    const targetSelectedResourceId = getTargetSelectedResourceId(getState());
    const targetSelectedAttributionId =
      getTargetSelectedAttributionId(getState());

    if (targetSelectedResourceId) {
      dispatch(setSelectedResourceId(targetSelectedResourceId));
      dispatch(setTargetSelectedResourceId(null));
    }

    if (targetSelectedAttributionId) {
      dispatch(setSelectedAttributionId(targetSelectedAttributionId));
      dispatch(setTargetSelectedAttributionId(null));
    }
  };
}

export function openResourceInResourceBrowser(
  resourceId: string,
): AppThunkAction {
  return (dispatch) => {
    dispatch(setExpandedIds(getParents(resourceId).concat([resourceId])));
    dispatch(setSelectedResourceId(resourceId));
  };
}
