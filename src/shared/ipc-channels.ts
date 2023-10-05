// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum IpcChannel {
  DeleteFile = 'delete-file',
  ExportFile = 'export-file',
  KeepFile = 'keep-file',
  OpenFile = 'open-file',
  OpenLink = 'open-link',
  SaveFile = 'save-file',
  SendErrorInformation = 'send-error-information',
  ConvertInputFile = 'convert-input-file',
  UseOutdatedInputFile = 'use-outdated-input-file',
  OpenDotOpossumFile = 'open-dot-opossum-file',
}

export enum AllowedFrontendChannels {
  ExportFileRequest = 'export-file-request',
  FileLoaded = 'file-loaded',
  FileLoading = 'file-loading',
  Logging = 'logging',
  ResetLoadedFile = 'reset-loaded-file',
  RestoreFrontend = 'restore-frontend',
  SaveFileRequest = 'save-file-request',
  SetBaseURLForRoot = 'set-base-url-for-root',
  ShowChangedInputFilePopup = 'show-changed-input-file-pop-up',
  ShowFileSupportPopup = 'show-file-support-popup',
  ShowSearchPopup = 'show-search-pop-up',
  ShowProjectMetadataPopup = 'show-project-metadata-pop-up',
  ShowProjectStatisticsPopup = 'show-project-statistics-pop-up',
  ShowUpdateAppPopup = 'show-update-app-pop-up',
  ShowLocatorPopup = 'show-locator-pop-up',
  SetQAMode = 'set-qa-mode',
}
