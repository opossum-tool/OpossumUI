// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionInfo,
  Attributions,
  BaseUrlsForSources,
  ExternalAttributionSources,
  PackageInfo,
  ProjectMetadata,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';

export interface JsonParsingError {
  message: string;
  type: 'jsonParsingError';
}

export interface InvalidDotOpossumFileError {
  filesInArchive: string;
  type: 'invalidDotOpossumFileError';
}

export interface GlobalBackendState {
  projectTitle?: string;
  resourceFilePath?: string;
  attributionFilePath?: string;
  opossumFilePath?: string;
  followUpFilePath?: string;
  compactBomFilePath?: string;
  detailedBomFilePath?: string;
  spdxYamlFilePath?: string;
  spdxJsonFilePath?: string;
  projectId?: string;
  inputContainsCriticalExternalAttributions?: boolean;
  inputFileChecksum?: string;
  inputFileRaw?: Uint8Array;
}

export type RawPackageInfo = PackageInfo & { originId?: string };

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
  baseUrlsForSources?: BaseUrlsForSources;
  externalAttributionSources?: ExternalAttributionSources;
}

export interface ParsedOpossumOutputFile {
  metadata: {
    projectId: string;
    fileCreationDate: string;
    inputFileMD5Checksum?: string;
  };
  manualAttributions: RawAttributions;
  resourcesToAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
}

export interface ParsedOpossumInputAndOutput {
  input: ParsedOpossumInputFile;
  output: ParsedOpossumOutputFile | null;
}

export interface OpossumOutputFile {
  metadata: {
    projectId: string;
    fileCreationDate: string;
    inputFileMD5Checksum?: string;
  };
  manualAttributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Array<string>;
}

export type KeysOfAttributionInfo = keyof AttributionInfo;
