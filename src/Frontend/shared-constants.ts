// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Criticality,
  type PackageInfo,
  type ProjectConfig,
  type ProjectMetadata,
  type RawProjectConfig,
} from '../shared/shared-types';

export const ROOT_PATH = '/';

export const EMPTY_PROJECT_METADATA: ProjectMetadata = {
  projectId: '',
  fileCreationDate: '',
};

export const EMPTY_PROJECT_CONFIG: ProjectConfig = {
  classifications: {},
};

export const EMPTY_RAW_PROJECT_CONFIG: RawProjectConfig = {
  classifications: {},
};

export const EMPTY_DISPLAY_PACKAGE_INFO: PackageInfo = {
  id: '',
  criticality: Criticality.None,
};

export const legacyOutputFileEnding = '_attributions.json';
