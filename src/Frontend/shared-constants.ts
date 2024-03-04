// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  FrequentLicenses,
  PackageInfo,
  ProjectMetadata,
} from '../shared/shared-types';
import { text } from '../shared/text';

export const ROOT_PATH = '/';

export const EMPTY_ATTRIBUTION_DATA: AttributionData = {
  attributions: {},
  resourcesToAttributions: {},
  attributionsToResources: {},
  resourcesWithAttributedChildren: {
    paths: [],
    pathsToIndices: {},
    attributedChildren: {},
  },
};

export const EMPTY_FREQUENT_LICENSES: FrequentLicenses = {
  nameOrder: [],
  texts: {},
};

export const EMPTY_PROJECT_METADATA: ProjectMetadata = {
  projectId: '',
  fileCreationDate: '',
};

export const EMPTY_DISPLAY_PACKAGE_INFO: PackageInfo = {
  id: '',
};

export const FILTERS = Object.values(text.filters);
export type Filter = (typeof FILTERS)[number];
export type FilterCounts = Partial<Record<Filter, number>>;

export const SIGNAL_FILTERS = [
  text.filters.firstParty,
  text.filters.thirdParty,
  text.filters.highConfidence,
  text.filters.notExcludedFromNotice,
  text.filters.notPreSelected,
  text.filters.previouslyPreferred,
] satisfies Array<Filter>;

export const ATTRIBUTION_FILTERS = [
  text.filters.firstParty,
  text.filters.thirdParty,
  text.filters.incompleteLegal,
  text.filters.incompleteCoordinates,
  text.filters.excludedFromNotice,
  text.filters.lowConfidence,
  text.filters.needsFollowUp,
  text.filters.needsReview,
  text.filters.preSelected,
  text.filters.currentlyPreferred,
  text.filters.previouslyPreferred,
  text.filters.modifiedPreviouslyPreferred,
] satisfies Array<Filter>;

export const SORTINGS = Object.values(text.sortings);
export type Sorting = (typeof SORTINGS)[number];
