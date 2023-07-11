// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ChangeEvent } from 'react';
import { DisplayPackageInfo } from '../../shared/shared-types';
import { AppThunkDispatch } from '../state/types';
import { setTemporaryDisplayPackageInfo } from '../state/actions/resource-actions/all-views-simple-actions';

export function setUpdateTemporaryDisplayPackageInfoForCreator(
  dispatch: AppThunkDispatch,
  temporaryDisplayPackageInfo: DisplayPackageInfo,
) {
  return (propertyToUpdate: string) => {
    return (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ): void => {
      const newValueOfTemporaryDisplayPackageInfoProperty =
        event.target.type === 'number'
          ? parseInt(event.target.value)
          : propertyToUpdate === 'comments'
          ? [event.target.value]
          : event.target.value;

      dispatch(
        setTemporaryDisplayPackageInfo({
          ...temporaryDisplayPackageInfo,
          [propertyToUpdate]: newValueOfTemporaryDisplayPackageInfoProperty,
        }),
      );
    };
  };
}
