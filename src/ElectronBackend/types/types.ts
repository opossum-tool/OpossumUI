// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  ExternalAttributionSources,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
  Source,
} from '../../shared/shared-types';
import { AttributionInfo } from '../../Frontend/Components/Table/Table';

export interface JsonParsingError {
  message: string;
  type: 'jsonParsingError';
}

export interface GlobalBackendState {
  projectTitle?: string;
  resourceFilePath?: string;
  attributionFilePath?: string;
  followUpFilePath?: string;
  compactBomFilePath?: string;
  detailedBomFilePath?: string;
  spdxYamlFilePath?: string;
  spdxJsonFilePath?: string;
  projectId?: string;
}

interface RawPackageInfo {
  attributionConfidence?: number;
  comment?: string;
  packageName?: string;
  packageVersion?: string;
  packageNamespace?: string;
  packageType?: string;
  packagePURLAppendix?: string;
  url?: string;
  copyright?: string;
  licenseName?: string;
  licenseText?: string;
  firstParty?: boolean;
  followUp?: string;
  source?: Source;
  originId?: string;
  preSelected?: boolean;
  excludeFromNotice?: boolean;
}

export interface RawAttributions {
  [uuid: string]: RawPackageInfo;
}

export interface RawFrequentLicense {
  shortName: string;
  fullName: string;
  defaultText: string;
}

export interface ParsedOpossumInputFile {
  metadata: ProjectMetadata;
  resources: Resources;
  externalAttributions: RawAttributions;
  resourcesToAttributions: ResourcesToAttributions;
  frequentLicenses?: Array<RawFrequentLicense>;
  attributionBreakpoints?: Array<string>;
  filesWithChildren?: Array<string>;
  baseUrlsForSources?: RawBaseUrlsForSources;
  externalAttributionSources?: ExternalAttributionSources;
}

export interface RawBaseUrlsForSources {
  [path: string]: string;
}

export interface ParsedOpossumOutputFile {
  metadata: {
    projectId: string;
    fileCreationDate: string;
  };
  manualAttributions: RawAttributions;
  resourcesToAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
}

export interface OpossumOutputFile {
  metadata: {
    projectId: string;
    fileCreationDate: string;
  };
  manualAttributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Array<string>;
}

export type KeysOfAttributionInfo = keyof AttributionInfo;
