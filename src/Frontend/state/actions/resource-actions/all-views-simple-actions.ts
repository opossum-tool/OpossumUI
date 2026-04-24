// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type PackageInfo } from '../../../../shared/shared-types';
import {
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_IS_PACKAGE_INFO_DIRTY,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  type ResetResourceStateAction,
  type SetIsPackageInfoDirtyAction,
  type SetTemporaryDisplayPackageInfoAction,
} from './types';

export function resetResourceState(): ResetResourceStateAction {
  return { type: ACTION_RESET_RESOURCE_STATE };
}

export function setTemporaryDisplayPackageInfo(
  packageInfo: PackageInfo,
): SetTemporaryDisplayPackageInfoAction {
  return { type: ACTION_SET_TEMPORARY_PACKAGE_INFO, payload: packageInfo };
}

export function setIsPackageInfoDirty(
  isDirty: boolean,
): SetIsPackageInfoDirtyAction {
  return {
    type: ACTION_SET_IS_PACKAGE_INFO_DIRTY,
    payload: isDirty,
  };
}
