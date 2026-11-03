// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app } from 'electron';

/**
 * Returns whether this Electron process is a dev-only watcher restart (see
 * `vite.config.mts`, which sets `OPOSSUM_ELECTRON_RESTARTED` in dev). The
 * `app.isPackaged` check makes the dev-only gating explicit and fail-closed:
 * even if someone sets the flag in the environment of a packaged app, this
 * never reports a dev restart.
 *
 * Gate any dev-only behavior on this helper instead of reading the env
 * variable directly, so the packaged-app guard cannot be forgotten.
 */
export function isDevRestarted(): boolean {
  return !app.isPackaged && process.env.OPOSSUM_ELECTRON_RESTARTED === '1';
}
