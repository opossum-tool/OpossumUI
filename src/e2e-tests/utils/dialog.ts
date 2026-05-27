// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ElectronApplication } from '@playwright/test';

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
