// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum IpcChannel {
  ExportFile = 'export-file',
  OpenFile = 'open-file',
  SelectFile = 'select-file',
  ImportFileSelectSaveLocation = 'import-file-select-save-location',
  ImportFileConvertAndLoad = 'import-file-convert-and-load',
  MergeFileAndLoad = 'merge-file-and-load',
  OpenLink = 'open-link',
  SaveFile = 'save-file',
  /**
   * @deprecated see https://github.com/opossum-tool/OpossumUI/issues/2812
   */
  StopLoading = 'stop-loading',
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
  OpenFileWithUnsavedCheck = 'open-file-with-unsaved-check',
  ShowImportDialog = 'show-import-dialog',
  ShowMergeDialog = 'show-merge-dialog',
  ShowProjectMetadataPopup = 'show-project-metadata-pop-up',
  ShowProjectStatisticsPopup = 'show-project-statistics-pop-up',
  ShowUpdateAppPopup = 'show-update-app-pop-up',
  UserSettingsChanged = 'user-settings-changed',
}
