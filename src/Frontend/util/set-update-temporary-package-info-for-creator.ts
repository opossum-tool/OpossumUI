// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ChangeEvent } from 'react';
import { PackageInfo } from '../../shared/shared-types';
import { AppThunkDispatch } from '../state/types';
import { setTemporaryPackageInfo } from '../state/actions/resource-actions/all-views-simple-actions';

export function setUpdateTemporaryPackageInfoForCreator(
  dispatch: AppThunkDispatch,
  temporaryPackageInfo: PackageInfo
) {
  return (propertyToUpdate: string) => {
    return (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
      const newValue =
        event.target.type === 'number'
          ? parseInt(event.target.value)
          : event.target.value;
      dispatch(
        setTemporaryPackageInfo({
          ...temporaryPackageInfo,
          [propertyToUpdate]: newValue,
        })
      );
    };
  };
}
