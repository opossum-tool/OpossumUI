// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type FileFormatInfo,
  type UserSettings,
} from '../../shared/shared-types';
import { type PopupType } from '../enums/enums';
import { type ResourceState } from '../state/reducers/resource-reducer';
import { type VariablesState } from '../state/reducers/variables-reducer';
import { type ViewState } from '../state/reducers/view-reducer';

export type State = {
  resourceState: ResourceState;
  viewState: ViewState;
  variablesState: VariablesState;
  userSettingsState: UserSettings;
};

export type SelectedProgressBar =
  | 'attribution'
  | 'criticality'
  | 'classification';

export interface ClassificationStatisticsEntry {
  description: string;
  resourceCount: number;
  color: string;
}

export type ClassificationStatistics = Record<
  number,
  ClassificationStatisticsEntry
>;

export interface FileWithAttributionsCounts {
  fileCount: number;
  manualNonPreSelectedFileCount: number;
  manualPreSelectedFileCount: number;
  onlyExternalFileCount: number;
}

export interface ResourceCriticalityCounts {
  highlyCriticalResourceCount: number;
  mediumCriticalResourceCount: number;
  nonCriticalResourceCount: number;
}

export interface PopupInfo {
  popup: PopupType;
  attributionId?: string;
  fileFormat?: FileFormatInfo;
}

export interface ChartDataItem extends Record<string, unknown> {
  name: string;
  count: number;
}
