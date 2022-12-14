// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  FrequentLicenses,
  ProjectMetadata,
} from '../shared/shared-types';

export const SOURCE_TOTAL = 'Total';
export const LICENSE_TOTAL = 'Total';

export const EMPTY_ATTRIBUTION_DATA: AttributionData = {
  attributions: {},
  resourcesToAttributions: {},
  attributionsToResources: {},
  resourcesWithAttributedChildren: {},
};

export const EMPTY_FREQUENT_LICENSES: FrequentLicenses = {
  nameOrder: [],
  texts: {},
};

export const EMPTY_PROJECT_METADATA: ProjectMetadata = {
  projectId: '',
  fileCreationDate: '',
};

export const POPUP_MAX_WIDTH_BREAKPOINT = 'xl';

export const MUI_BREAKPOINTS_TO_PIXELS_MAPPING = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};
