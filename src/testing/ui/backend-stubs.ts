// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { vi } from 'vitest';

import { executeCommand } from '../../ElectronBackend/api/commands';

/**
 * Routes the given backend command to `handler` and falls through to the real
 * `executeCommand` for all other commands. Call `restoreBackendCommandExecution`
 * in an `afterEach` afterwards.
 */
export function interceptBackendCommand(
  command: string,
  handler: (params: never) => Promise<never>,
): void {
  vi.mocked(window.electronAPI.api).mockImplementation(
    (currentCommand, params) =>
      currentCommand === command
        ? handler(params as never)
        : executeCommand(currentCommand, params as never),
  );
}

export function restoreBackendCommandExecution(): void {
  vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
}
