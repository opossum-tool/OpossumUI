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
  ParsedFileContent,
  ToggleHighlightForCriticalExternalAttributionsArgs,
} from '../../shared/shared-types';

type ResetStateListener = (
  event: IpcRendererEvent,
  resetState: boolean
) => void;

type SetStateListener = (
  event: IpcRendererEvent,
  resourceStructure: ParsedFileContent
) => void;

type ExportFileRequestListener = (
  event: IpcRendererEvent,
  exportType: ExportType
) => void;

type LoggingListener = (event: IpcRendererEvent, logging: string) => void;

type SetBaseURLForRootListener = (
  event: IpcRendererEvent,
  baseURLForRootArgs: BaseURLForRootArgs
) => void;

type ToggleHighlightForCriticalExternalAttributionsListener = (
  event: IpcRendererEvent,
  showHighlightForCriticalExternalAttributionsArgs: ToggleHighlightForCriticalExternalAttributionsArgs
) => void;

type Listener =
  | ResetStateListener
  | SetStateListener
  | LoggingListener
  | ExportFileRequestListener
  | SetBaseURLForRootListener
  | ToggleHighlightForCriticalExternalAttributionsListener;

export function useIpcRenderer(
  channel: AllowedFrontendChannels,
  listener: Listener,
  dependencies: Array<unknown>
): void {
  useEffect(() => {
    window.electronAPI.on(channel, listener);

    return (): void => {
      window.electronAPI.removeListener(channel);
    };
    // eslint-disable-next-line
  }, dependencies);
}
