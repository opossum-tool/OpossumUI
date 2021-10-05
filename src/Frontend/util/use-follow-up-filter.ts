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
import { areOnlyFollowUpAttributionsShown } from '../state/selectors/view-selector';
import { useSelector } from 'react-redux';
import { setFollowUpFilter } from '../state/actions/view-actions/view-actions';
import { useDispatch } from 'react-redux';

export function useFollowUpFilter(): {
  filterForFollowUp: boolean;
  handleFilterChange: () => void;
  getFilteredAttributions(
    attributions: AttributionsWithResources | Attributions
  ): AttributionsWithResources | Attributions;
} {
  const dispatch = useDispatch();

  const filterForFollowUp = useSelector(areOnlyFollowUpAttributionsShown);
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

  return { filterForFollowUp, handleFilterChange, getFilteredAttributions };
}
