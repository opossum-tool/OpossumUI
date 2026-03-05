// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getParents } from '../../helpers/get-parents';
import {
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
} from '../../selectors/resource-selectors';
import { AppThunkAction } from '../../types';
import {
  setExpandedIds,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from './audit-view-simple-actions';

export function setSelectedResourceOrAttributionIdToTargetValue(): AppThunkAction {
  return (dispatch, getState) => {
    const targetSelectedResourceId = getTargetSelectedResourceId(getState());
    const targetSelectedAttributionId =
      getTargetSelectedAttributionId(getState());

    if (targetSelectedResourceId !== null) {
      dispatch(setSelectedResourceId(targetSelectedResourceId));
      dispatch(setTargetSelectedResourceId(null));
    }

    if (targetSelectedAttributionId !== null) {
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
