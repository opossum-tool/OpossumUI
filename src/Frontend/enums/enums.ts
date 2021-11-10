// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
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
  NotSavedPopup = 'NotSavedPopup',
  ReplaceAttributionPopup = 'ReplaceAttributionPopup',
  ConfirmDeletionPopup = 'ConfirmDeletionPopup',
  ConfirmDeletionGloballyPopup = 'ConfirmDeletionGloballyPopup',
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
  Delete = 'Delete',
  DeleteGlobally = 'Delete globally',
  Hide = 'Hide',
  MarkForReplacement = 'Mark for replacement',
  Save = 'Save',
  SaveGlobally = 'Save globally',
  Replace = 'Replace',
  ReplaceMarked = 'Replace marked',
  Undo = 'Undo',
  UnmarkForReplacement = 'Unmark for replacement',
  Unhide = 'Unhide',
  ShowResources = 'Show resources',
}

export enum FilterType {
  OnlyFirstParty = 'Only First Party',
  HideFirstParty = 'Hide First Party',
  OnlyFollowUp = 'Only Follow Up',
}
