// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle, PopupType } from '../enums/enums';
import { ResourceState } from '../state/reducers/resource-reducer';
import { ViewState } from '../state/reducers/view-reducer';
import {
  AttributionIdWithCount,
  Attributions,
  Criticality,
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

export interface ListCardContent {
  id: string;
  name?: string;
  packageVersion?: string;
  copyright?: string;
  licenseText?: string;
  comment?: string;
  url?: string;
  licenseName?: string;
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
  onClick(): void;
  buttonText: string;
  isDisabled?: boolean;
}

export interface PanelData {
  title: PackagePanelTitle;
  attributionIdsWithCount: Array<AttributionIdWithCount>;
  attributions: Attributions;
}

export interface AttributionIdsWithCountAndResourceId {
  resourceId: string;
  attributionIdsWithCount: Array<AttributionIdWithCount>;
}

export interface FolderProgressBarDataAndResourceId {
  folderProgressBarData: ProgressBarData | null;
  resourceId: string;
}

export interface ProgressBarWorkerArgs {
  resources: Resources | null;
  resourceId: string;
  manualAttributions: Attributions;
  resourcesToManualAttributions: ResourcesToAttributions;
  resourcesToExternalAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
  attributionBreakpoints: Set<string>;
  filesWithChildren: Set<string>;
}
