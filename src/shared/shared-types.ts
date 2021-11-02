// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ErrorInfo } from 'react';
import { AttributionInfo } from '../Frontend/Components/Table/Table';

export interface Resources {
  [resourceName: string]: Resources | 1;
}

export type FollowUp = 'FOLLOW_UP';
export const FollowUp = 'FOLLOW_UP';

export interface PackageInfo {
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
  followUp?: FollowUp;
  source?: Source;
  originId?: string;
  preSelected?: boolean;
  excludeFromNotice?: boolean;
}

export interface Source {
  name: string;
  documentConfidence: number;
}

export interface AttributionIdWithCount {
  attributionId: string;
  childrenWithAttributionCount?: number;
}

export interface Attributions {
  [uuid: string]: PackageInfo;
}

export interface ResourcesToAttributions {
  [path: string]: Array<string>;
}

export interface AttributionsToResources {
  [uuid: string]: Array<string>;
}

export interface ResourcesWithAttributedChildren {
  [path: string]: Set<string>;
}

export interface AttributionData {
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
  attributionsToResources: AttributionsToResources;
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren;
}

export interface AttributionsWithResources {
  [uuid: string]: AttributionInfo;
}

export interface FrequentLicences {
  nameOrder: Array<string>;
  texts: LicenseTexts;
}

export interface LicenseTexts {
  [licenseName: string]: string;
}

export interface ProjectMetadata {
  projectId: string;
  fileCreationDate: string;
  projectTitle?: string;
  [otherMetadata: string]: unknown;
}

export interface ParsedFileContent {
  metadata: ProjectMetadata;
  resources: Resources;
  manualAttributions: {
    attributions: Attributions;
    resourcesToAttributions: ResourcesToAttributions;
  };
  externalAttributions: {
    attributions: Attributions;
    resourcesToAttributions: ResourcesToAttributions;
  };
  frequentLicenses: FrequentLicences;
  resolvedExternalAttributions: Set<string>;
  attributionBreakpoints: Set<string>;
  filesWithChildren: Set<string>;
  baseUrlsForSources: BaseUrlsForSources;
  externalAttributionSources: ExternalAttributionSources;
}

export interface BaseUrlsForSources {
  [path: string]: string;
}

export interface SendErrorInformationArgs {
  error: Error;
  errorInfo: ErrorInfo;
}

export interface SaveFileArgs {
  manualAttributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
}

export enum ExportType {
  FollowUp = 'FollowUp',
  CompactBom = 'CompactBom',
  DetailedBom = 'DetailedBom',
  SpdxDocumentYaml = 'SpdxDocumentYaml',
  SpdxDocumentJson = 'SpdxDocumentJson',
}

export interface ExportFollowUpArgs {
  type: ExportType.FollowUp;
  followUpAttributionsWithResources: AttributionsWithResources;
}

export interface ExportCompactBomArgs {
  type: ExportType.CompactBom;
  bomAttributions: Attributions;
}

export interface ExportDetailedBomArgs {
  type: ExportType.DetailedBom;
  bomAttributionsWithResources: AttributionsWithResources;
}

export interface ExportSpdxDocumentYamlArgs {
  type: ExportType.SpdxDocumentYaml;
  spdxAttributions: Attributions;
}

export interface ExportSpdxDocumentJsonArgs {
  type: ExportType.SpdxDocumentJson;
  spdxAttributions: Attributions;
}

export type ExportArgsType =
  | ExportFollowUpArgs
  | ExportCompactBomArgs
  | ExportDetailedBomArgs
  | ExportSpdxDocumentYamlArgs
  | ExportSpdxDocumentJsonArgs;

export interface OpenLinkArgs {
  link: string;
}

export interface BaseURLForRootArgs {
  baseURLForRoot: string;
}

export interface ExternalAttributionSources {
  [source: string]: {
    name: string;
    priority: number;
  };
}
