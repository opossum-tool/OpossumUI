// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle, PopupType } from '../enums/enums';
import { ResourceState } from '../state/reducers/resource-reducer';
import { ViewState } from '../state/reducers/view-reducer';
import {
  Attributions,
  Criticality,
  DisplayPackageInfo,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';

export type State = {
  resourceState: ResourceState;
  viewState: ViewState;
};

export interface ProgressBarData {
  fileCount: number;
  filesWithManualAttributionCount: number;
  filesWithOnlyPreSelectedAttributionCount: number;
  filesWithOnlyExternalAttributionCount: number;
  resourcesWithNonInheritedExternalAttributionOnly: Array<string>;
  filesWithHighlyCriticalExternalAttributionsCount: number;
  filesWithMediumCriticalExternalAttributionsCount: number;
  resourcesWithHighlyCriticalExternalAttributions: Array<string>;
  resourcesWithMediumCriticalExternalAttributions: Array<string>;
}

export interface PanelPackage {
  panel: PackagePanelTitle;
  attributionId: string;
}

export interface NumberOfDisplayedItems {
  numberOfDisplayedItems: number;
}

export interface Height {
  height: number;
}

export type KeysOfPackageInfo = keyof PackageInfo;

export type KeysOfDisplayPackageInfo = keyof DisplayPackageInfo;

export interface PackageCardConfig {
  isExternalAttribution?: boolean;
  isSelected?: boolean;
  isResolved?: boolean;
  isPreSelected?: boolean;
}

export interface ListCardConfig {
  isResource?: true;
  isExternalAttribution?: boolean;
  isSelected?: boolean;
  isMarkedForReplacement?: boolean;
  isResolved?: boolean;
  isPreSelected?: boolean;
  excludeFromNotice?: boolean;
  firstParty?: boolean;
  needsReview?: boolean;
  followUp?: boolean;
  isHeader?: boolean;
  isContextMenuOpen?: boolean;
  isMultiSelected?: boolean;
  criticality?: Criticality;
}

export interface PathPredicate {
  (path: string): boolean;
}

export interface ResourcesListBatch {
  resourceIds: Array<string>;
  header?: string;
}

export interface PopupInfo {
  popup: PopupType;
  attributionId?: string;
}

export interface ButtonConfig {
  onClick(event: React.MouseEvent<HTMLButtonElement>): void;
  buttonText: string;
  disabled?: boolean;
  isDark?: boolean;
  tooltipText?: string;
  tooltipPlacement?: 'left' | 'right' | 'top' | 'bottom';
}

export interface PanelData {
  title: PackagePanelTitle;
  attributionIdsWithCount:
    | Array<AttributionIdWithCount>
    | Array<DisplayAttributionWithCount>;
  attributions: Attributions;
}

export interface AttributionIdsWithCountAndResourceId {
  resourceId: string;
  attributionIdsWithCount: Array<AttributionIdWithCount>;
}

export interface ProgressBarDataAndResourceId {
  progressBarData: ProgressBarData | null;
  resourceId: string;
}

export interface ProgressBarWorkerArgs {
  resources: Resources | null;
  resourceId: string;
  manualAttributions: Attributions;
  externalAttributions: Attributions;
  resourcesToManualAttributions: ResourcesToAttributions;
  resourcesToExternalAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
  attributionBreakpoints: Set<string>;
  filesWithChildren: Set<string>;
}

export interface PieChartData {
  name: string;
  count: number;
}

export interface LicenseCounts {
  attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense;
  totalAttributionsPerLicense: { [licenseName: string]: number };
  totalAttributionsPerSource: { [sourceName: string]: number };
}

export interface AttributionCountPerSourcePerLicense {
  [licenseName: string]: { [sourceName: string]: number };
}

export interface LicenseNamesWithCriticality {
  [licenseName: string]: Criticality | undefined;
}
export type ProgressBarType = 'FolderProgressBar' | 'TopProgressBar';

export interface ListWithAttributesItemAttribute {
  text: string;
  id?: string;
}

export interface ListWithAttributesItem {
  text: string;
  id: string;
  manuallyAdded?: boolean;
  attributes?: Array<ListWithAttributesItemAttribute>;
}
export interface PackageAttributes {
  [uuid: string]: {
    text: string;
    count?: number;
    relatedIds?: Set<string>;
    manuallyAdded?: boolean;
  };
}

export interface PackageAttributeIds {
  namespaceId: string;
  nameId: string;
  versionId: string;
}

export interface AttributionIdWithCount {
  attributionId: string;
  count?: number;
}

export interface DisplayAttributionWithCount extends AttributionIdWithCount {
  attribution: DisplayPackageInfo;
}

export function isDisplayAttributionWithCount(
  testObject: AttributionIdWithCount | DisplayAttributionWithCount
): testObject is DisplayAttributionWithCount {
  return 'attribution' in testObject;
}
