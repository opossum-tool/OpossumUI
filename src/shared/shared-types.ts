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

export enum Criticality {
  None,
  Medium,
  High,
}

export const RawCriticality: Record<Criticality, string | undefined> = {
  [Criticality.None]: undefined,
  [Criticality.Medium]: 'medium',
  [Criticality.High]: 'high',
};

export type Classification = number;

export enum DiscreteConfidence {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  High = 80,
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Low = 20,
}

export interface Source {
  name: string;
  documentConfidence?: number;
  additionalName?: string;
}

export type Relation = 'resource' | 'children' | 'parents' | 'unrelated';

type Expand<T> = T extends unknown ? { [K in keyof T]: T[K] } : never;

type Never<T, K extends keyof T> = Expand<
  Omit<T, K> & Partial<Record<K, never>>
>;

interface EphemeralPackageInfoProps {
  count?: number;
  id: string;
  originalAttributionId?: string;
  originalAttributionWasPreferred?: boolean;
  originalAttributionSource?: Source;
  relation?: Relation;
  resources?: Array<string>;
  suffix?: string;
  synthetic?: boolean;
}

export interface PackageInfo extends EphemeralPackageInfoProps {
  attributionConfidence?: number;
  classification?: Classification;
  comment?: string;
  copyright?: string;
  count?: number;
  criticality: Criticality;
  excludeFromNotice?: boolean;
  firstParty?: boolean;
  followUp?: boolean;
  licenseName?: string;
  licenseText?: string;
  needsReview?: boolean;
  originIds?: Array<string>;
  packageName?: string;
  packageNamespace?: string;
  packagePURLAppendix?: string;
  packageType?: string;
  packageVersion?: string;
  preSelected?: boolean;
  preferred?: boolean;
  preferredOverOriginIds?: Array<string>;
  source?: Source;
  url?: string;
  wasPreferred?: boolean;
}

export interface RawPackageInfo
  extends Never<
    Omit<Omit<PackageInfo, 'followUp'>, 'criticality'>,
    keyof EphemeralPackageInfoProps
  > {
  originId?: string;
  criticality?: string;
  followUp?: 'FOLLOW_UP';
}

export interface RawAttributions {
  [uuid: string]: RawPackageInfo;
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
  paths: Array<string>;
  pathsToIndices: { [path: string]: number };
  attributedChildren: { [index: number]: Set<number> };
}

interface InputFileAttributionData {
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
  attributionsToResources: AttributionsToResources;
}

export interface AttributionData extends InputFileAttributionData {
  attributionsToResources: AttributionsToResources;
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren;
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

export interface ClassificationEntry {
  description: string;
  color: string;
}

export type ClassificationsConfig = Record<Classification, ClassificationEntry>;

export type RawClassificationsConfig = Record<Classification, string>;

export interface ProjectConfig {
  classifications: ClassificationsConfig;
}

export interface RawProjectConfig {
  classifications: RawClassificationsConfig;
}

export interface ParsedFileContent {
  metadata: ProjectMetadata;
  resources: Resources;
  config: RawProjectConfig;
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
  followUpAttributionsWithResources: Attributions;
}

export interface ExportCompactBomArgs {
  type: ExportType.CompactBom;
  bomAttributions: Attributions;
}

export interface ExportDetailedBomArgs {
  type: ExportType.DetailedBom;
  bomAttributionsWithResources: Attributions;
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

export interface ExternalAttributionSource {
  name: string;
  priority: number;
  isRelevantForPreferred?: boolean;
}

export interface ExternalAttributionSources {
  [source: string]: ExternalAttributionSource;
}

export enum FileType {
  LEGACY_OPOSSUM,
  SCANCODE_JSON,
  OWASP_JSON,
}

export interface FileFormatInfo {
  fileType: FileType;
  name: string;
  extensions: Array<string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (event: IpcRendererEvent, ...args: Array<any>) => void;

export interface ElectronAPI {
  quit: () => void;
  relaunch: () => void;
  openLink: (link: string) => Promise<unknown>;
  openFile: () => Promise<unknown>;
  selectFile: (fileFormat: FileFormatInfo) => Promise<string>;
  importFileSelectSaveLocation: (defaultPath: string) => Promise<string>;
  importFileConvertAndLoad: (
    inputFilePath: string,
    fileType: FileType,
    opossumFilePath: string,
  ) => Promise<boolean>;
  mergeFileAndLoad: (
    inputFilePath: string,
    fileType: FileType,
  ) => Promise<boolean>;
  exportFile: (args: ExportArgsType) => void;
  saveFile: (saveFileArgs: SaveFileArgs) => void;
  /**
   * @deprecated see https://github.com/opossum-tool/OpossumUI/issues/2812
   */
  stopLoading: () => void;
  on: (channel: AllowedFrontendChannels, listener: Listener) => () => void;
  getUserSettings: () => Promise<UserSettings>;
  updateUserSettings: (userSettings: Partial<UserSettings>) => Promise<void>;
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

export type ProcessingStateUpdatedEventLevel = 'info' | 'error' | 'warn';

export type ProcessingStateChangedEvent =
  | ProcessingStartedEvent
  | ProcessingDoneEvent
  | ProcessingStateUpdatedEvent;

export interface ProcessingStartedEvent {
  type: 'ProcessingStarted';
}

export interface ProcessingDoneEvent {
  type: 'ProcessingDone';
}

export interface ProcessingStateUpdatedEvent {
  type: 'ProcessingStateUpdated';
  date: Date;
  message: string;
  level: ProcessingStateUpdatedEventLevel;
}

export interface UserSettings {
  qaMode: boolean;
  showProjectStatistics: boolean;
  areHiddenSignalsVisible: boolean;
  showCriticality: boolean;
  showClassifications: boolean;
  panelSizes: {
    resourceBrowserWidth: number;
    packageListsWidth: number;
    linkedResourcesPanelHeight: number | null;
    signalsPanelHeight: number | null;
  };
  recentlyOpenedPaths: Array<string>;
}

export type PanelSizes = UserSettings['panelSizes'];
