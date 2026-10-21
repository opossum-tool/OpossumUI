// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ElectronApplication } from '@playwright/test';

const DIALOG_STUB_STATE_KEY = '__opossumE2EDialogStubState';

interface DialogStubState {
  unexpectedDialogCalls: Array<string>;
}

export async function installDefaultSyncDialogStubs(
  app: ElectronApplication,
): Promise<void> {
  await app.evaluate(({ dialog }, stateKey) => {
    const state: DialogStubState = { unexpectedDialogCalls: [] };
    Reflect.set(dialog, stateKey, state);
    Reflect.set(dialog, 'showOpenDialogSync', () => {
      state.unexpectedDialogCalls.push('showOpenDialogSync');
      return undefined;
    });
    Reflect.set(dialog, 'showSaveDialogSync', () => {
      state.unexpectedDialogCalls.push('showSaveDialogSync');
      return undefined;
    });
  }, DIALOG_STUB_STATE_KEY);
}

export async function getUnexpectedSyncDialogCalls(
  app: ElectronApplication,
): Promise<Array<string>> {
  try {
    return await app.evaluate(({ dialog }, stateKey) => {
      const state = Reflect.get(dialog, stateKey) as
        DialogStubState | undefined;
      return state?.unexpectedDialogCalls ?? [];
    }, DIALOG_STUB_STATE_KEY);
  } catch {
    // The app has already been closed by the test (e.g. relaunched).
    return [];
  }
}

export async function stubOpenDialogSync(
  app: ElectronApplication,
  value: Array<string> | undefined,
): Promise<void> {
  await app.evaluate(({ dialog }, returnValue) => {
    Reflect.set(dialog, 'showOpenDialogSync', () => returnValue);
  }, value);
}

export async function stubSaveDialogSync(
  app: ElectronApplication,
  value: string | undefined,
): Promise<void> {
  await app.evaluate(({ dialog }, returnValue) => {
    Reflect.set(dialog, 'showSaveDialogSync', () => returnValue);
  }, value);
}
