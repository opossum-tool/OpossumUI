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
  ReplaceAttributionPopup = 'ReplaceAttributionPopup',
  ConfirmDeletionPopup = 'ConfirmDeletionPopup',
  ConfirmDeletionGloballyPopup = 'ConfirmDeletionGloballyPopup',
  ConfirmMultiSelectDeletionPopup = 'ConfirmMultiSelectDeletionPopup',
  EditAttributionPopup = 'EditAttributionPopup',
  PackageSearchPopup = 'PackageSearchPopup',
  ChangedInputFilePopup = 'ChangedInputFilePopup',
  AttributionWizardPopup = 'AttributionWizardPopup',
  FileSupportPopup = 'FileSupportPopup',
  FileSupportDotOpossumAlreadyExistsPopup = 'FileSupportDotOpossumAlreadyExistsPopup',
  UpdateAppPopup = 'UpdateAppPopup',
  LocatorPopup = 'LocatorPopup',
  ModifyWasPreferredAttributionPopup = 'ModifyWasPreferredAttributionPopup',
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
  Back = 'Back',
  Cancel = 'Cancel',
  Clear = 'Clear',
  Close = 'Close',
  Confirm = 'Confirm',
  ConfirmGlobally = 'Confirm globally',
  ConfirmSelectedGlobally = 'Confirm selected globally',
  CreateAndProceed = 'Create and proceed',
  Delete = 'Delete',
  DeleteGlobally = 'Delete globally',
  DeleteSelectedGlobally = 'Delete selected globally',
  Discard = 'Discard',
  Hide = 'Hide',
  Keep = 'Keep',
  MarkForReplacement = 'Mark current for replacement',
  Next = 'Next',
  Ok = 'Ok',
  OpenAttributionWizardPopup = 'Open attribution wizard',
  OpenDotOpossumFile = 'Open ".opossum" file',
  Replace = 'Replace',
  ReplaceMarked = 'Replace marked with current',
  Revert = 'Revert',
  Save = 'Save',
  SaveGlobally = 'Save globally',
  ShowResources = 'Show resources',
  Unhide = 'Unhide',
  UnmarkForReplacement = 'Unmark current for replacement',
}

export enum FilterType {
  OnlyFirstParty = 'Only First Party',
  HideFirstParty = 'Hide First Party',
  OnlyFollowUp = 'Only Follow Up',
  OnlyNeedsReview = 'Only Needs Review',
  OnlyPreferred = 'Only Preferred',
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
