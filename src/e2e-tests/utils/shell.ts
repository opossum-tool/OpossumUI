// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ElectronApplication } from '@playwright/test';

const SHELL_STUB_STATE_KEY = '__opossumE2EShellStubState';
const OPEN_PATH_STUB_STATE_KEY = '__opossumE2EShellOpenPathStubState';

interface ShellStubState {
  showItemInFolderCalls: Array<string>;
}

interface OpenPathStubState {
  openPathCalls: Array<string>;
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

export async function stubOpenPath(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ shell }, stateKey) => {
    const state: OpenPathStubState = { openPathCalls: [] };
    Reflect.set(shell, stateKey, state);
    Reflect.set(shell, 'openPath', (filePath: string) => {
      state.openPathCalls.push(filePath);
    });
  }, OPEN_PATH_STUB_STATE_KEY);
}

export async function getOpenPathCalls(
  app: ElectronApplication,
): Promise<Array<string>> {
  return app.evaluate(({ shell }, stateKey) => {
    const state = Reflect.get(shell, stateKey) as OpenPathStubState | undefined;
    return state?.openPathCalls ?? [];
  }, OPEN_PATH_STUB_STATE_KEY);
}
