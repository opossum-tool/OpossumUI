// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
export const ATTRIBUTION_FILTER_KEYS = [
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
  license?: string;
  incompleteCoordinates?: IncompleteCoordinateFilterValue;
  incompleteLegal?: IncompleteLegalFilterValue;
};
