// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum View {
  Audit = 'Audit',
  Report = 'Report',
}

export enum PopupType {
  FileSupportDotOpossumAlreadyExistsPopup = 'FileSupportDotOpossumAlreadyExistsPopup',
  FileSupportPopup = 'FileSupportPopup',
  InvalidLinkPopup = 'InvalidLinkPopup',
  NotSavedPopup = 'NotSavedPopup',
  ProjectMetadataPopup = 'ProjectMetadataPopup',
  ProjectStatisticsPopup = 'ProjectStatisticsPopup',
  UpdateAppPopup = 'UpdateAppPopup',
}

export enum ButtonText {
  Close = 'Close',
  CreateAndProceed = 'Create and proceed',
  Delete = 'Delete',
  Keep = 'Keep',
  OpenDotOpossumFile = 'Open ".opossum" file',
}

export enum ProjectStatisticsPopupTitle {
  LicenseCountsTable = 'Signals per Sources',
  AttributionPropertyCountTable = 'Attributions Overview',
  CriticalLicensesTable = 'Critical Licenses',
  PieChartsSectionHeader = 'Pie Charts',
  MostFrequentLicenseCountPieChart = 'Most Frequent Licenses',
  CriticalSignalsCountPieChart = 'Signals by Criticality',
  IncompleteLicensesPieChart = 'Incomplete Attributions',
}

export enum CriticalityTypes {
  HighCriticality = 'High',
  MediumCriticality = 'Medium',
  AnyCriticality = 'Any',
}

export enum PieChartCriticalityNames {
  HighCriticality = 'Highly critical signals',
  MediumCriticality = 'Medium critical signals',
  NoCriticality = 'Non-critical signals',
}

export enum AttributionType {
  FirstParty = 'First Party',
  ThirdParty = 'Third Party',
}
