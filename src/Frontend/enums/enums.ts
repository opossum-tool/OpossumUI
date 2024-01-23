// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum View {
  Attribution = 'Attribution',
  Audit = 'Audit',
  Report = 'Report',
}

export enum PopupType {
  UnableToSavePopup = 'UnableToSavePopup',
  InvalidLinkPopup = 'InvalidLinkPopup',
  FileSearchPopup = 'FileSearchPopup',
  ProjectMetadataPopup = 'ProjectMetadataPopup',
  ProjectStatisticsPopup = 'ProjectStatisticsPopup',
  NotSavedPopup = 'NotSavedPopup',
  ReplaceAttributionsPopup = 'ReplaceAttributionsPopup',
  ConfirmDeletionPopup = 'ConfirmDeletionPopup',
  ConfirmDeletionGloballyPopup = 'ConfirmDeletionGloballyPopup',
  ConfirmMultiSelectDeletionPopup = 'ConfirmMultiSelectDeletionPopup',
  ChangedInputFilePopup = 'ChangedInputFilePopup',
  FileSupportPopup = 'FileSupportPopup',
  FileSupportDotOpossumAlreadyExistsPopup = 'FileSupportDotOpossumAlreadyExistsPopup',
  UpdateAppPopup = 'UpdateAppPopup',
  LocatorPopup = 'LocatorPopup',
  ChangePreferredStatusGloballyPopup = 'ChangePreferredStatusGloballyPopup',
}

export enum SavePackageInfoOperation {
  Create = 'Create',
  Delete = 'Delete',
  Link = 'Link',
  Replace = 'Replace',
  Update = 'Update',
}

export enum AllowedSaveOperations {
  All = 'All',
  Local = 'Local',
  None = 'None',
}

export enum PackagePanelTitle {
  AllAttributions = 'All Attributions',
  ContainedExternalPackages = 'Signals in Folder Content',
  ContainedManualPackages = 'Attributions in Folder Content',
  ExternalPackages = 'Signals',
  ManualPackages = 'Attributions',
}

export enum ButtonText {
  Apply = 'Apply',
  ApplyChanges = 'Apply changes',
  Back = 'Back',
  Cancel = 'Cancel',
  Clear = 'Clear',
  Close = 'Close',
  Confirm = 'Confirm',
  ConfirmGlobally = 'Confirm globally',
  CreateAndProceed = 'Create and proceed',
  CompareToOrigin = 'Compare to origin',
  Delete = 'Delete',
  DeleteGlobally = 'Delete globally',
  Discard = 'Discard',
  Hide = 'Hide',
  Keep = 'Keep',
  Next = 'Next',
  Ok = 'Ok',
  OpenDotOpossumFile = 'Open ".opossum" file',
  Revert = 'Revert',
  RevertAll = 'Revert all',
  Save = 'Save',
  SaveGlobally = 'Save globally',
  ShowResources = 'Show resources',
  Unhide = 'Unhide',
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
  NoCriticality = 'Not critical signals',
}

export enum HighlightingColor {
  LightOrange = 'Light Orange',
  DarkOrange = 'Dark Orange',
}

export enum AttributionType {
  FirstParty = 'First Party',
  ThirdParty = 'Third Party',
}
