// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  DisplayPackageInfo,
  FrequentLicenses,
  ProjectMetadata,
} from '../shared/shared-types';

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
  attributionIds: [],
};

export const ADD_NEW_ATTRIBUTION_BUTTON_ID = 'ADD_NEW_ATTRIBUTION_ID';
export const ADD_NEW_ATTRIBUTION_BUTTON_TEXT = 'Add new attribution';
