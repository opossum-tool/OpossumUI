// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { IpcRendererEvent } from 'electron';
import { useEffect } from 'react';

import type { AllowedFrontendChannels } from '../../shared/ipc-channels';
import type {
  ExportType,
  FileFormatInfo,
  Log,
  ParsedFileContent,
  ProcessingStateChangedEvent,
  UserSettings,
} from '../../shared/shared-types';

type ResetStateListener = (
  event: IpcRendererEvent,
  resetState: boolean,
) => void;

type SetStateListener = (
  event: IpcRendererEvent,
  resourceStructure: ParsedFileContent,
) => void;

export type ExportFileRequestListener = (
  event: IpcRendererEvent,
  exportType: ExportType,
) => void;

export type LoggingListener = (event: IpcRendererEvent, log: Log) => void;

export type ProcessingStateChangedListener = (
  event: IpcRendererEvent,
  processingStateChangedEvent: ProcessingStateChangedEvent,
) => void;

export type SetBaseURLForRootListener = (
  event: IpcRendererEvent,
  baseURL: string,
) => void;

export type ShowImportDialogListener = (
  event: IpcRendererEvent,
  fileFormat: FileFormatInfo,
  canImportIntoCurrentProject: boolean,
) => void;

export type ShowMergeOpossumFilesDialogListener = (
  event: IpcRendererEvent,
  canMergeIntoCurrentFile: boolean,
  currentFilePath?: string,
) => void;

export type ShowSplitDialog = (event: IpcRendererEvent) => void;

export type OpenFileListener = (
  event: IpcRendererEvent,
  filePath?: string,
) => void;

export type UserSettingsChangedListener = (
  event: IpcRendererEvent,
  payload: Partial<UserSettings>,
) => void;

export type SetDatabaseInitializedListener = (
  event: IpcRendererEvent,
  databaseInitialized: boolean,
) => void;

type Listener =
  | ResetStateListener
  | SetStateListener
  | LoggingListener
  | ExportFileRequestListener
  | SetBaseURLForRootListener
  | OpenFileListener
  | ShowImportDialogListener
  | ProcessingStateChangedListener
  | ShowMergeOpossumFilesDialogListener
  | ShowSplitDialog
  | UserSettingsChangedListener
  | SetDatabaseInitializedListener;

export function useIpcRenderer<T extends Listener>(
  channel: AllowedFrontendChannels,
  listener: T,
  dependencies: Array<unknown>,
): void {
  useEffect(() => {
    const removeListener = window.electronAPI.on(channel, listener);

    return () => {
      removeListener();
    };
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, dependencies);
}
