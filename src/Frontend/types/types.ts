// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IpcRenderer } from 'electron';
import { PackagePanelTitle } from '../enums/enums';
import { ResourceState } from '../state/reducers/resource-reducer';
import { ViewState } from '../state/reducers/view-reducer';
import { PackageInfo } from '../../shared/shared-types';

declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

export type State = {
  resourceState: ResourceState;
  viewState: ViewState;
};

export interface ProgressBarData {
  fileCount: number;
  filesWithManualAttributionCount: number;
  filesWithOnlyPreSelectedAttributionCount: number;
  filesWithOnlyExternalAttributionCount: number;
  filesWithSignalOnly: Array<string>;
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
}

export interface PathPredicate {
  (path: string): boolean;
}
