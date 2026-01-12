// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  BaseUrlsForSources,
  ExternalAttributionSources,
  ProjectMetadata,
  RawAttributions,
  RawProjectConfig,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';

export interface ParsingError {
  message: string;
  type:
    | 'fileNotFoundError'
    | 'jsonParsingError'
    | 'invalidDotOpossumFileError'
    | 'unZippingError';
}

export interface FileNotFoundError extends ParsingError {
  type: 'fileNotFoundError';
}

export interface UnZipError extends ParsingError {
  type: 'unZippingError';
}

export interface JsonParsingError extends ParsingError {
  type: 'jsonParsingError';
}

export interface InvalidDotOpossumFileError extends ParsingError {
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
  inputFileChecksum?: string;
  inputFileRaw?: Uint8Array;
}

export interface RawFrequentLicense {
  shortName: string;
  fullName: string;
  defaultText: string;
}

export interface ParsedOpossumInputFile {
  metadata: ProjectMetadata;
  resources: Resources;
  config?: RawProjectConfig;
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
  resolvedExternalAttributions: Array<string> | undefined;
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
  manualAttributions: RawAttributions;
  resourcesToAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Array<string>;
}
