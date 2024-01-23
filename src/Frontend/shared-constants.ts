// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  DiscreteConfidence,
  DisplayPackageInfo,
  FrequentLicenses,
  ProjectMetadata,
} from '../shared/shared-types';
import { text } from '../shared/text';

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

export const EMPTY_DISPLAY_PACKAGE_INFO: DisplayPackageInfo = {
  attributionConfidence: DiscreteConfidence.High,
  attributionIds: [],
};

export const ADD_NEW_ATTRIBUTION_BUTTON_ID = 'ADD_NEW_ATTRIBUTION_ID';
export const ADD_NEW_ATTRIBUTION_BUTTON_TEXT = 'Add new attribution';

export const filters = Object.values(text.filters);
export type Filter = (typeof filters)[number];
export const qaFilters = ['Currently Preferred'] satisfies Array<Filter>;
export type FilterCounts = Record<Filter, number>;

export const sortings = Object.values(text.sortings);
export type Sorting = (typeof sortings)[number];
export const attributionDefaultSorting = text.sortings.name;
export const signalDefaultSorting = text.sortings.occurrence;
