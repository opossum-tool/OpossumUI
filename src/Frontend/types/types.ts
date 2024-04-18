// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../shared/shared-types';
import { PopupType } from '../enums/enums';
import { ResourceState } from '../state/reducers/resource-reducer';
import { VariablesState } from '../state/reducers/variables-reducer';
import { ViewState } from '../state/reducers/view-reducer';

export type State = {
  resourceState: ResourceState;
  viewState: ViewState;
  variablesState: VariablesState;
};

export type ProgressBarFileCounts = {
  files: number;
  filesWithManualAttribution: number;
  filesWithOnlyPreSelectedAttribution: number;
  filesWithOnlyExternalAttribution: number;
  filesWithHighlyCriticalExternalAttributions: number;
  filesWithMediumCriticalExternalAttributions: number;
};

export type ProgressBarResourcesData = {
  withNonInheritedExternalAttributionOnly: Array<string>;
  withHighlyCriticalExternalAttributions: Array<string>;
  withMediumCriticalExternalAttributions: Array<string>;
};

export interface ProgressBarWithButtonsData {
  count: ProgressBarFileCounts;
  resources: ProgressBarResourcesData;
}

export interface PopupInfo {
  popup: PopupType;
  attributionId?: string;
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
