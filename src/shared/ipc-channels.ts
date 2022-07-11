// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

export enum IpcChannel {
  ExportFile = 'export-file',
  OpenFile = 'open-file',
  OpenLink = 'open-link',
  SaveFile = 'save-file',
  SendErrorInformation = 'send-error-information',
}

export enum AllowedFrontendChannels {
  ExportFileRequest = 'export-file-request',
  FileLoaded = 'file-loaded',
  Logging = 'logging',
  ResetLoadedFile = 'reset-loaded-file',
  RestoreFrontend = 'restore-frontend',
  SaveFileRequest = 'save-file-request',
  ToggleHighlightForCriticalSignals = 'toggle-highlight-for-critical-signals',
  ShowSearchPopup = 'show-search-pop-up',
  ShowProjectMetadataPopup = 'show-project-metadata-pop-up',
  ShowProjectStatisticsPopup = 'show-project-statistics-pop-up',
  SetBaseURLForRoot = 'set-base-url-for-root',
}
