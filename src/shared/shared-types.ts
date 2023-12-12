// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { IpcRendererEvent } from 'electron';
import { ErrorInfo } from 'react';

import { AllowedFrontendChannels } from './ipc-channels';

export interface Resources {
  [resourceName: string]: Resources | 1;
}

export type FollowUp = 'FOLLOW_UP';
export const FollowUp = 'FOLLOW_UP';

export enum Criticality {
  High = 'high',
  Medium = 'medium',
}

enum AnyCriticality {
  Any = 'any',
}
export type SelectedCriticality = Criticality | AnyCriticality;
export const SelectedCriticality = {
  ...Criticality,
  ...AnyCriticality,
};

export enum DiscreteConfidence {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  High = 80,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Low = 20,
}

export interface PackageInfoCore {
  attributionConfidence?: number;
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
  originIds?: Array<string>;
  preSelected?: boolean;
  excludeFromNotice?: boolean;
  criticality?: Criticality;
  needsReview?: boolean;
  preferred?: boolean;
  preferredOverOriginIds?: Array<string>;
  wasPreferred?: boolean;
}

export interface PackageInfo extends PackageInfoCore {
  comment?: string;
}

export interface DisplayPackageInfo extends PackageInfoCore {
  comments?: Array<string>;
  attributionIds: Array<string>;
}

export interface Source {
  name: string;
  documentConfidence: number;
  additionalName?: string;
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

export interface AttributionsToHashes {
  [uuid: string]: string;
}

export interface ResourcesWithAttributedChildren {
  paths: Array<string>;
  pathsToIndices: { [path: string]: number };
  attributedChildren: { [index: number]: Set<number> };
}

export interface InputFileAttributionData {
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
}

export interface AttributionData extends InputFileAttributionData {
  attributionsToResources: AttributionsToResources;
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren;
}

export interface AttributionInfo extends PackageInfo {
  resources: Array<string>;
}

export interface AttributionsWithResources {
  [uuid: string]: AttributionInfo;
}

export interface FrequentLicenseName {
  shortName: string;
  fullName: string;
}

export interface FrequentLicenses {
  nameOrder: Array<FrequentLicenseName>;
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
  manualAttributions: InputFileAttributionData;
  externalAttributions: InputFileAttributionData;
  frequentLicenses: FrequentLicenses;
  resolvedExternalAttributions: Set<string>;
  attributionBreakpoints: Set<string>;
  filesWithChildren: Set<string>;
  baseUrlsForSources: BaseUrlsForSources;
  externalAttributionSources: ExternalAttributionSources;
}

export interface BaseUrlsForSources {
  [path: string]: string | null;
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

export interface IsLoadingArgs {
  isLoading: boolean;
}

export interface QAModeArgs {
  qaMode: boolean;
}

export interface ExternalAttributionSource {
  name: string;
  priority: number;
  isRelevantForPreferred?: boolean;
}

export interface ExternalAttributionSources {
  [source: string]: ExternalAttributionSource;
}

export interface FileSupportPopupArgs {
  showFileSupportPopup: boolean;
  dotOpossumFileAlreadyExists: boolean;
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export type Listener = (event: IpcRendererEvent, ...args: Array<any>) => void;

export interface ElectronAPI {
  openLink: (link: string) => Promise<unknown>;
  openFile: () => Promise<unknown>;
  deleteFile: () => Promise<unknown>;
  keepFile: () => Promise<unknown>;
  convertInputFileToDotOpossum: () => void;
  useOutdatedInputFileFormat: () => void;
  openDotOpossumFile: () => void;
  sendErrorInformation: (
    errorInformationArgs: SendErrorInformationArgs,
  ) => void;
  exportFile: (args: ExportArgsType) => void;
  saveFile: (saveFileArgs: SaveFileArgs) => void;
  on: (channel: AllowedFrontendChannels, listener: Listener) => () => void;
  getUserSetting: <T extends keyof UserSettings>(
    key: T,
  ) => Promise<UserSettings[T]>;
  setUserSetting: <T extends keyof UserSettings>(
    key: T,
    value: UserSettings[T],
  ) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface Log {
  date: Date;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface UserSettings {
  showProjectStatistics: boolean;
}

export type SignalWithCount = PackageInfo & {
  count?: number;
};
