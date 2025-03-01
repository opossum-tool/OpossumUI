// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { IpcRendererEvent } from 'electron';
import { useEffect } from 'react';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  BaseURLForRootArgs,
  ExportType,
  FileFormatInfo,
  IsLoadingArgs,
  Log,
  ParsedFileContent,
} from '../../shared/shared-types';

export type ResetStateListener = (
  event: IpcRendererEvent,
  resetState: boolean,
) => void;

export type SetStateListener = (
  event: IpcRendererEvent,
  resourceStructure: ParsedFileContent,
) => void;

export type ExportFileRequestListener = (
  event: IpcRendererEvent,
  exportType: ExportType,
) => void;

export type LoggingListener = (event: IpcRendererEvent, log: Log) => void;

export type SetBaseURLForRootListener = (
  event: IpcRendererEvent,
  baseURLForRootArgs: BaseURLForRootArgs,
) => void;

export type IsLoadingListener = (
  event: IpcRendererEvent,
  isLoadingArgs: IsLoadingArgs,
) => void;

export type ShowImportDialogListener = (
  event: IpcRendererEvent,
  fileFormat: FileFormatInfo,
) => void;

export type ShowMergeDialogListener = (
  event: IpcRendererEvent,
  fileFormat: FileFormatInfo,
) => void;

export type Listener =
  | ResetStateListener
  | SetStateListener
  | LoggingListener
  | ExportFileRequestListener
  | SetBaseURLForRootListener
  | IsLoadingListener
  | ShowImportDialogListener
  | ShowMergeDialogListener;

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
    // eslint-disable-next-line
  }, dependencies);
}
