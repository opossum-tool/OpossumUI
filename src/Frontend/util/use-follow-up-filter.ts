// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import pickBy from 'lodash/pickBy';
import { useState } from 'react';
import {
  Attributions,
  AttributionsWithResources,
  PackageInfo,
} from '../../shared/shared-types';

export function useFollowUpFilter(): {
  filterForFollowUp: boolean;
  handleFilterChange: () => void;
  getFilteredAttributions(
    attributions: AttributionsWithResources | Attributions
  ): AttributionsWithResources | Attributions;
} {
  const [filterForFollowUp, setFilterForFollowUp] = useState(false);
  function handleFilterChange(): void {
    setFilterForFollowUp(!filterForFollowUp);
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
