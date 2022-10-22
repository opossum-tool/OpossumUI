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
}

export enum SavePackageInfoOperation {
  Create = 'Create',
  Delete = 'Delete',
  Link = 'Link',
  Replace = 'Replace',
  Update = 'Update',
}

export enum PackagePanelTitle {
  AllAttributions = 'All Attributions',
  ContainedExternalPackages = 'Signals in Folder Content',
  ContainedManualPackages = 'Attributions in Folder Content',
  ExternalPackages = 'Signals',
  ManualPackages = 'Attributions',
}

export enum DiscreteConfidence {
  High = 80,
  Low = 20,
}

export enum ButtonText {
  Close = 'Close',
  Cancel = 'Cancel',
  Confirm = 'Confirm',
  ConfirmGlobally = 'Confirm globally',
  ConfirmSelectedGlobally = 'Confirm selected globally',
  Delete = 'Delete',
  DeleteGlobally = 'Delete globally',
  DeleteSelectedGlobally = 'Delete selected globally',
  Hide = 'Hide',
  Keep = 'Keep',
  MarkForReplacement = 'Mark for replacement',
  Replace = 'Replace',
  ReplaceMarked = 'Replace marked',
  Save = 'Save',
  SaveGlobally = 'Save globally',
  ShowResources = 'Show resources',
  Undo = 'Undo',
  UnmarkForReplacement = 'Unmark for replacement',
  Unhide = 'Unhide',
}

export enum FilterType {
  OnlyFirstParty = 'Only First Party',
  HideFirstParty = 'Hide First Party',
  OnlyFollowUp = 'Only Follow Up',
}

export enum CheckboxLabel {
  FirstParty = '1st Party',
  FollowUp = 'Follow-up',
  ExcludeFromNotice = 'Exclude From Notice',
}

export enum ProjectStatisticsPopupTitle {
  AttributionCountPerSourcePerLicenseTable = 'Signals per Sources',
  AttributionPropertyCountTable = 'First Party and Follow Up Attributions',
  CriticalLicensesTable = 'Critical Licenses',
  PieChartsSectionHeader = 'View Pie Charts',
  MostFrequentLicenseCountPieChart = 'Most Frequent Licenses',
  CriticalSignalsCountPieChart = 'Critical Signals',
  IncompleteLicensesPieChart = 'Incomplete attributions',
}
