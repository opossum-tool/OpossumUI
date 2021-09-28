// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum View {
  Audit = 'Audit',
  Attribution = 'Attribution',
  Report = 'Report',
}

export enum PopupType {
  ErrorPopup = 'ErrorPopup',
  NotSavedPopup = 'NotSavedPopup',
  FileSearchPopup = 'FileSearchPopup',
  ProjectMetadataPopup = 'ProjectMetadataPopup',
  ReplaceAttributionPopup = 'ReplaceAttributionPopup',
}

export enum SavePackageInfoOperation {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
  Link = 'Link',
  Replace = 'Replace',
}

export enum PackagePanelTitle {
  ExternalPackages = 'Signals',
  ContainedManualPackages = 'Attributions in Folder Content',
  ContainedExternalPackages = 'Signals in Folder Content',
  AllAttributions = 'All Attributions',
  ManualPackages = 'Attributions',
}

export enum DiscreteConfidence {
  High = 80,
  Low = 20,
}

export enum ButtonTitle {
  Cancel = 'Cancel',
  Confirm = 'Confirm',
  ConfirmForAll = 'Confirm for all',
  Delete = 'Delete',
  DeleteForAll = 'Delete for all',
  Save = 'Save',
  SaveForAll = 'Save for all',
  Undo = 'Undo',
  Replace = 'Replace',
  MarkForReplacement = 'Mark for replacement',
  UnmarkForReplacement = 'Unmark for replacement',
  ReplaceMarkedBy = 'Replace marked by',
  Replace = 'Replace',
  MarkForReplacement = 'Mark for replacement',
  UnmarkForReplacement = 'Unmark for replacement',
  ReplaceMarkedBy = 'Replace marked by',
}
