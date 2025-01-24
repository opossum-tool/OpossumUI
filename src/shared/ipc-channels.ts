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
  ImportFileSelectInput = 'import-file-select-input',
  ImportFileSelectSaveLocation = 'import-file-select-save-location',
  ImportFileConvertAndLoad = 'import-file-convert-and-load',
  OpenLink = 'open-link',
  SaveFile = 'save-file',
  SendErrorInformation = 'send-error-information',
  ConvertInputFile = 'convert-input-file',
  OpenDotOpossumFile = 'open-dot-opossum-file',
  GetUserSettings = 'get-user-settings',
  SetUserSettings = 'set-user-settings',
  Quit = 'quit',
  Relaunch = 'relaunch',
}

export enum AllowedFrontendChannels {
  ExportFileRequest = 'export-file-request',
  FileLoaded = 'file-loaded',
  FileLoading = 'file-loading',
  Logging = 'logging',
  ResetLoadedFile = 'reset-loaded-file',
  RestoreFrontend = 'restore-frontend',
  SaveFileRequest = 'save-file-request',
  SearchAttributions = 'search-attributions',
  SearchLinkedResources = 'search-linked-resources',
  SearchResources = 'search-resources',
  SearchSignals = 'search-signals',
  SetBaseURLForRoot = 'set-base-url-for-root',
  ShowFileSupportPopup = 'show-file-support-popup',
  ImportFileShowDialog = 'import-file-show-dialog',
  ShowProjectMetadataPopup = 'show-project-metadata-pop-up',
  ShowProjectStatisticsPopup = 'show-project-statistics-pop-up',
  ShowUpdateAppPopup = 'show-update-app-pop-up',
  UserSettingsChanged = 'user-settings-changed',
}
