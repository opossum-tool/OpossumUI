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
  InvalidLinkPopup = 'InvalidLinkPopup',
  NotSavedPopup = 'NotSavedPopup',
  ProjectMetadataPopup = 'ProjectMetadataPopup',
  ProjectStatisticsPopup = 'ProjectStatisticsPopup',
  UpdateAppPopup = 'UpdateAppPopup',
  ImportDialog = 'ImportDialog',
  MergeDialog = 'MergeDialog',
}

export enum ButtonText {
  Close = 'Close',
  Delete = 'Delete',
}

export enum AttributionType {
  FirstParty = 'First Party',
  ThirdParty = 'Third Party',
}
