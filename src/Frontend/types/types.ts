// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Classification,
  Criticality,
  FileFormatInfo,
} from '../../shared/shared-types';
import { PopupType } from '../enums/enums';
import { ResourceState } from '../state/reducers/resource-reducer';
import { VariablesState } from '../state/reducers/variables-reducer';
import { ViewState } from '../state/reducers/view-reducer';

export type State = {
  resourceState: ResourceState;
  viewState: ViewState;
  variablesState: VariablesState;
};

export type SelectedProgressBar =
  | 'attribution'
  | 'criticality'
  | 'classification';

export interface ClassificationStatisticsEntry {
  description: string;
  correspondingFiles: Array<string>;
  color: string;
}

export type ClassificationStatistics = Record<
  number,
  ClassificationStatisticsEntry
>;

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
  classificationStatistics: ClassificationStatistics;
}

export interface PopupInfo {
  popup: PopupType;
  attributionId?: string;
  fileFormat?: FileFormatInfo;
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

export type LicenseNamesWithCriticality = Record<string, Criticality>;

export type LicenseNamesWithClassification = Record<
  string,
  Classification | undefined
>;
