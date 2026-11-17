// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindow } from 'electron';
import { type Mock, vi } from 'vitest';

/**
 * Creates a fake Electron `BrowserWindow` whose only behavior is a
 * `webContents.send` spy, so tests can assert on the IPC messages the backend
 * sends to the renderer.
 */
export function fakeMainWindow(): { mainWindow: BrowserWindow; send: Mock } {
  const send = vi.fn();
  const mainWindow = { webContents: { send } } as unknown as BrowserWindow;
  return { mainWindow, send };
}
