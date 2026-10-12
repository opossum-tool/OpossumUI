// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEqualToManualAttribution } from '../../../../shared/attribution-comparison';
import type { PackageInfo } from '../../../../shared/shared-types';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../selectors/resource-selectors';
import type { AppThunkAction } from '../../types';
import { initializePackageInfoEditing } from './all-views-simple-actions';

export function acceptSavedPackageInfoEditing({
  attributionId,
  resourceId,
  submittedPackageInfo,
}: {
  attributionId: string;
  resourceId: string;
  submittedPackageInfo: PackageInfo;
}): AppThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    if (
      getSelectedAttributionId(state) !== attributionId ||
      getSelectedResourceId(state) !== resourceId ||
      !isEqualToManualAttribution(
        getTemporaryDisplayPackageInfo(state),
        submittedPackageInfo,
      )
    ) {
      return;
    }

    dispatch(initializePackageInfoEditing(submittedPackageInfo));
  };
}
