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
  Close = 'Close',
  Cancel = 'Cancel',
  Clear = 'Clear',
  Confirm = 'Confirm',
  ConfirmGlobally = 'Confirm globally',
  ConfirmSelectedGlobally = 'Confirm selected globally',
  CreateAndProceed = 'Create and proceed',
  Delete = 'Delete',
  DeleteGlobally = 'Delete globally',
  DeleteSelectedGlobally = 'Delete selected globally',
  Hide = 'Hide',
  Keep = 'Keep',
  MarkForReplacement = 'Mark for replacement',
  Next = 'Next',
  OpenAttributionWizardPopup = 'Open attribution wizard',
  Replace = 'Replace',
  ReplaceMarked = 'Replace marked',
  Save = 'Save',
  SaveGlobally = 'Save globally',
  ShowResources = 'Show resources',
  Undo = 'Undo',
  UnmarkForReplacement = 'Unmark for replacement',
  Unhide = 'Unhide',
  OpenDotOpossumFile = 'Open ".opossum" file',
  MarkAsPreferred = 'Mark as preferred',
  UnmarkAsPreferred = 'Unmark as preferred',
}

export enum FilterType {
  OnlyFirstParty = 'Only First Party',
  HideFirstParty = 'Hide First Party',
  OnlyFollowUp = 'Only Follow Up',
  OnlyNeedsReview = 'Only Needs Review',
  OnlyPreferred = 'Only Preferred',
}

export enum CheckboxLabel {
  FirstParty = '1st Party',
  FollowUp = 'Follow-up',
  ExcludeFromNotice = 'Exclude From Notice',
  NeedsReview = 'Needs Review',
  OnlyLicenseName = 'Only search the license name',
}

export enum ProjectStatisticsPopupTitle {
  LicenseCountsTable = 'Signals per Sources',
  AttributionPropertyCountTable = 'Attributions Overview',
  CriticalLicensesTable = 'Critical Licenses',
  PieChartsSectionHeader = 'Pie Charts',
  MostFrequentLicenseCountPieChart = 'Most Frequent Licenses',
  CriticalSignalsCountPieChart = 'Critical Signals',
  IncompleteLicensesPieChart = 'Incomplete Attributions',
}

export enum CriticalityTypes {
  HighCriticality = 'High',
  MediumCriticality = 'Medium',
  NoCriticality = 'Not critical',
  AnyCriticality = 'Any',
}

export enum HighlightingColor {
  LightOrange = 'Light Orange',
  DarkOrange = 'Dark Orange',
}
