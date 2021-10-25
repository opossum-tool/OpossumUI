// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import pickBy from 'lodash/pickBy';
import {
  Attributions,
  AttributionsWithResources,
  PackageInfo,
} from '../../shared/shared-types';
import { setFollowUpFilter } from '../state/actions/view-actions/view-actions';
import { AppThunkDispatch } from '../state/types';

export function provideFollowUpFilter(
  filterForFollowUp: boolean,
  dispatch: AppThunkDispatch
): {
  handleFilterChange: () => void;
  getFilteredAttributions(
    attributions: AttributionsWithResources | Attributions
  ): AttributionsWithResources | Attributions;
} {
  function handleFilterChange(): void {
    dispatch(setFollowUpFilter(!filterForFollowUp));
  }
  function getFilteredAttributions(
    attributions: AttributionsWithResources | Attributions
  ): AttributionsWithResources | Attributions {
    return filterForFollowUp
      ? pickBy(attributions, (value: PackageInfo) => value.followUp)
      : attributions;
  }

  return { handleFilterChange, getFilteredAttributions };
}
