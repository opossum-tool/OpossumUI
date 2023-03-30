// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import pickBy from 'lodash/pickBy';
import {
  Attributions,
  AttributionsWithResources,
  PackageInfo,
} from '../../shared/shared-types';
import { AttributionsFilterType } from '../enums/enums';
import { useAppSelector } from '../state/hooks';
import { getActiveFilters } from '../state/selectors/view-selector';

export function useFilters(
  attributions: AttributionsWithResources
): AttributionsWithResources;
export function useFilters(attributions: Attributions): Attributions;
export function useFilters(
  attributions: AttributionsWithResources | Attributions
): AttributionsWithResources | Attributions {
  const activeFilters = useAppSelector(getActiveFilters);

  attributions = activeFilters.has(AttributionsFilterType.OnlyFollowUp)
    ? pickBy(attributions, (value: PackageInfo) => value.followUp)
    : attributions;
  attributions = activeFilters.has(AttributionsFilterType.OnlyFirstParty)
    ? pickBy(attributions, (value: PackageInfo) => value.firstParty)
    : attributions;
  attributions = activeFilters.has(AttributionsFilterType.HideFirstParty)
    ? pickBy(attributions, (value: PackageInfo) => !value.firstParty)
    : attributions;
  attributions = activeFilters.has(AttributionsFilterType.OnlyNeedsReview)
    ? pickBy(attributions, (value: PackageInfo) => value.needsReview)
    : attributions;
  return attributions;
}
