// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IpcRendererEvent } from 'electron';
import { useEffect } from 'react';
import { ExportType, ParsedFileContent } from '../../shared/shared-types';

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

type Listener =
  | ResetStateListener
  | SetStateListener
  | LoggingListener
  | ExportFileRequestListener;

export function useIpcRenderer(
  channel: string,
  listener: Listener,
  dependencies: Array<unknown>
): void {
  useEffect(() => {
    window.ipcRenderer.on(channel, listener);

    return (): void => {
      window.ipcRenderer.removeListener(channel, listener);
    };
    // eslint-disable-next-line
  }, dependencies);
}
