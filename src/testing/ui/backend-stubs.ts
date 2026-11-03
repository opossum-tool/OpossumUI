// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { vi } from 'vitest';

import {
  type CommandName,
  type CommandParams,
  type CommandReturn,
  executeCommand,
} from '../../ElectronBackend/api/commands';

/**
 * Routes the given backend command to `handler` and falls through to the real
 * `executeCommand` for all other commands. Call `restoreBackendCommandExecution`
 * in an `afterEach` afterwards.
 */
export function interceptBackendCommand<C extends CommandName>(
  command: C,
  handler: (params: CommandParams<C>) => Promise<Awaited<CommandReturn<C>>>,
): void {
  vi.mocked(window.electronAPI.api).mockImplementation(
    (currentCommand, params) => {
      if (currentCommand === command) {
        return handler(params as CommandParams<C>);
      }
      return executeCommand(currentCommand, params);
    },
  );
}

export function restoreBackendCommandExecution(): void {
  vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
}
