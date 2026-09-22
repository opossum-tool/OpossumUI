// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ElectronApplication } from '@playwright/test';

const SHELL_STUB_STATE_KEY = '__opossumE2EShellStubState';

interface ShellStubState {
  showItemInFolderCalls: Array<string>;
}

export async function stubShowItemInFolder(
  app: ElectronApplication,
): Promise<void> {
  await app.evaluate(({ shell }, stateKey) => {
    const state: ShellStubState = { showItemInFolderCalls: [] };
    Reflect.set(shell, stateKey, state);
    Reflect.set(shell, 'showItemInFolder', (filePath: string) => {
      state.showItemInFolderCalls.push(filePath);
    });
  }, SHELL_STUB_STATE_KEY);
}

export async function getShowItemInFolderCalls(
  app: ElectronApplication,
): Promise<Array<string>> {
  return app.evaluate(({ shell }, stateKey) => {
    const state = Reflect.get(shell, stateKey) as ShellStubState | undefined;
    return state?.showItemInFolderCalls ?? [];
  }, SHELL_STUB_STATE_KEY);
}
