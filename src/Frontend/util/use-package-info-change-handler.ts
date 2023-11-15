// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ChangeEvent } from 'react';

import { DisplayPackageInfo } from '../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { getTemporaryDisplayPackageInfo } from '../state/selectors/all-views-resource-selectors';

export function usePackageInfoChangeHandler(): (
  propertyToUpdate: keyof DisplayPackageInfo,
) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
  const dispatch = useAppDispatch();
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  return (propertyToUpdate: keyof DisplayPackageInfo) => {
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
