// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import settings from 'electron-settings';
import { rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DEFAULT_USER_SETTINGS } from '../../../shared/shared-constants';
import { UserSettingsProvider } from '../user-settings-provider';

describe('UserSettings', () => {
  let temporaryDir: string | undefined = undefined;
  beforeEach(async () => {
    temporaryDir = await mkdtemp(join(tmpdir(), 'OpossumUiTesting-'));
    settings.configure({ dir: temporaryDir });
  });

  afterEach(() => {
    if (temporaryDir) {
      rmSync(temporaryDir, { recursive: true, force: true });
    }
  });

  it('sets up the default values if empty', async () => {
    await UserSettingsProvider.init();

    const result = await settings.get();

    expect(result).toEqual(DEFAULT_USER_SETTINGS);
  });

  it('overwrites only the non set values if there are already values set', async () => {
    await settings.set('qaMode', true);

    await UserSettingsProvider.init();

    const result = await settings.get();

    expect(result).toEqual({ ...DEFAULT_USER_SETTINGS, qaMode: true });
  });

  it('resets everything if reset is requested', async () => {
    const oldEnvironment = process.env;
    process.env = { ...oldEnvironment, RESET: 'TRUE' };

    await settings.set('qaMode', true);

    await UserSettingsProvider.init();

    const result = await settings.get();

    expect(result).toEqual({ ...DEFAULT_USER_SETTINGS });
    process.env = oldEnvironment;
  });
});
