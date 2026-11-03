// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { normalizeLicenseSearch } from './text-search';

export const ATTRIBUTION_FILTER_KEYS = [
  'aiDeferred',
  'currentlyPreferred',
  'excludedFromNotice',
  'firstParty',
  'highConfidence',
  'lowConfidence',
  'modifiedPreferred',
  'needsFollowUp',
  'needsReview',
  'notExcludedFromNotice',
  'notPreSelected',
  'preSelected',
  'previouslyPreferred',
  'thirdParty',
] as const;

export type AttributionFilterKey = (typeof ATTRIBUTION_FILTER_KEYS)[number];

export const INCOMPLETE_COORDINATE_FILTER_VALUES = [
  'any',
  'url',
  'packageName',
  'packageType',
  'packageNamespace',
] as const;

type IncompleteCoordinateFilterValue =
  (typeof INCOMPLETE_COORDINATE_FILTER_VALUES)[number];

export const INCOMPLETE_LEGAL_FILTER_VALUES = [
  'any',
  'copyright',
  'licenseInformation',
] as const;

type IncompleteLegalFilterValue =
  (typeof INCOMPLETE_LEGAL_FILTER_VALUES)[number];

export type MissingAttribute = Exclude<
  IncompleteCoordinateFilterValue | IncompleteLegalFilterValue,
  'any'
>;

export type AttributionValueFilters = {
  classification?: number;
  criticality?: number;
  licenseIds?: Array<string>;
  licenseSearches?: Array<string>;
  incompleteCoordinates?: IncompleteCoordinateFilterValue;
  incompleteLegal?: IncompleteLegalFilterValue;
};

export type LicenseConditions = Pick<
  AttributionValueFilters,
  'licenseIds' | 'licenseSearches'
>;

export function hasLicenseConditions(filters?: LicenseConditions): boolean {
  return Boolean(
    filters?.licenseIds?.length ||
    filters?.licenseSearches?.some((search) =>
      normalizeLicenseSearch(search.trim()),
    ),
  );
}
