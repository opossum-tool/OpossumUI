// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum IpcChannel {
  OpenFile = 'open-file',
  SelectFile = 'select-file',
  SelectFiles = 'select-files',
  SelectSaveFile = 'select-save-file',
  ImportFileConvertAndLoad = 'import-file-convert-and-load',
  MergeFileAndLoad = 'merge-file-and-load',
  SelectSplitDestination = 'select-split-destination',
  SplitFile = 'split-file',
  MergeOpossumFiles = 'merge-opossum-files',
  MergeOpossumFilesFromPaths = 'merge-opossum-files-from-paths',
  OpenLink = 'open-link',
  SaveFile = 'save-file',
  ForceUnlock = 'force-unlock',
  ExportFile = 'export-file',
  /**
   * @deprecated see https://github.com/opossum-tool/OpossumUI/issues/2812
   */
  StopLoading = 'stop-loading',
  GetUserSettings = 'get-user-settings',
  UpdateUserSettings = 'update-user-settings',
  SetFrontendPopupOpen = 'set-frontend-popup-open',
  Quit = 'quit',
  Relaunch = 'relaunch',
}

export enum AllowedFrontendChannels {
  ExportFileRequest = 'export-file-request',
  Logging = 'logging',
  ResetLoadedFile = 'reset-loaded-file',
  RestoreFrontend = 'restore-frontend',
  SaveFileRequest = 'save-file-request',
  SearchAttributions = 'search-attributions',
  SearchLinkedResources = 'search-linked-resources',
  SearchResources = 'search-resources',
  SearchSignals = 'search-signals',
  SetBaseURLForRoot = 'set-base-url-for-root',
  OpenFile = 'open-file',
  ShowImportDialog = 'show-import-dialog',
  ShowMergeOpossumFilesDialog = 'show-merge-opossum-files-dialog',
  ShowSplitDialog = 'show-split-dialog',
  ShowForceUnlockDialog = 'show-force-unlock-dialog',
  ShowProjectMetadataPopup = 'show-project-metadata-pop-up',
  ShowProjectStatisticsPopup = 'show-project-statistics-pop-up',
  ShowUpdateAppPopup = 'show-update-app-pop-up',
  UserSettingsChanged = 'user-settings-changed',
  ProcessingStateChanged = 'processing-state-changed',
  SetDatabaseInitialized = 'set-database-initialized',
}
