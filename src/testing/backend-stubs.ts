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
} from '../ElectronBackend/api/commands';

/**
 * Routes the given backend command to `handler` and falls through to the real
 * `executeCommand` for all other commands. The global test setup resets the
 * api mock before every test, so this stub does not leak between tests and no
 * explicit cleanup is needed. `restoreBackendCommandExecution` is only required
 * to drop the stub mid-test, not in an `afterEach`.
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

/**
 * Unconditionally re-asserts `executeCommand` as the api implementation,
 * dropping both stubs from `interceptBackendCommand` and any custom api mock
 * (e.g. a failure simulation), so only use it after the relevant test finished.
 */
export function restoreBackendCommandExecution(): void {
  vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
}
