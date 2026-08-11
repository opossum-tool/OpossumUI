// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PackageInfo } from '../../../../shared/shared-types';
import {
  ACTION_INITIALIZE_PACKAGE_INFO_EDITING,
  ACTION_RESET_RESOURCE_STATE,
  ACTION_SET_TEMPORARY_PACKAGE_INFO,
  type InitializePackageInfoEditingAction,
  type ResetResourceStateAction,
  type SetTemporaryDisplayPackageInfoAction,
} from './types';

export function resetResourceState(): ResetResourceStateAction {
  return { type: ACTION_RESET_RESOURCE_STATE };
}

export function initializePackageInfoEditing(
  packageInfo: PackageInfo,
): InitializePackageInfoEditingAction {
  return { type: ACTION_INITIALIZE_PACKAGE_INFO_EDITING, payload: packageInfo };
}

export function setTemporaryDisplayPackageInfo(
  packageInfo: PackageInfo,
): SetTemporaryDisplayPackageInfoAction {
  return { type: ACTION_SET_TEMPORARY_PACKAGE_INFO, payload: packageInfo };
}
