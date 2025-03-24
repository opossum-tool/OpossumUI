// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow } from 'electron';
import settings from 'electron-settings';
import { rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  DEFAULT_PANEL_SIZES,
  DEFAULT_USER_SETTINGS,
} from '../../../shared/shared-constants';
import { UserSettingsService } from '../user-settings-service';

type MockedBrowserWindow = BrowserWindow & {
  sendFunction: (channel: string, ...args: Array<unknown>) => void;
};

jest.mock('electron', () => {
  const sendFunction = jest.fn();
  return {
    BrowserWindow: {
      getAllWindows: () => {
        return [
          {
            webContents: {
              send: sendFunction,
            },
          },
        ];
      },
      sendFunction,
    },
  };
});

describe('UserSettingsService', () => {
  let temporaryDir: string | undefined = undefined;
  beforeEach(async () => {
    temporaryDir = await mkdtemp(join(tmpdir(), 'OpossumUiTesting-'));
    settings.configure({ dir: temporaryDir, atomicSave: true });
  });

  afterEach(() => {
    if (temporaryDir) {
      rmSync(temporaryDir, { recursive: true, force: true });
    }
  });

  describe('init', () => {
    it('sets up the default values if empty', async () => {
      await UserSettingsService.init();

      const result = await settings.get();

      expect(result).toEqual(DEFAULT_USER_SETTINGS);
    });

    it('overwrites only the non set values if there are already values set', async () => {
      await settings.set('qaMode', true);

      await UserSettingsService.init();

      const result = await settings.get();

      expect(result).toEqual({ ...DEFAULT_USER_SETTINGS, qaMode: true });
    });

    it('resets everything if reset is requested', async () => {
      const oldEnvironment = process.env;
      process.env = { ...oldEnvironment, RESET: 'TRUE' };

      await settings.set('qaMode', true);

      await UserSettingsService.init();

      const result = await settings.get();

      expect(result).toEqual({ ...DEFAULT_USER_SETTINGS });
      process.env = oldEnvironment;
    });
  });

  describe('get', () => {
    it('gets a user setting from a predescribed path', async () => {
      await UserSettingsService.init();

      const panelSizes = await UserSettingsService.get('panelSizes');

      expect(panelSizes).toEqual(DEFAULT_PANEL_SIZES);
    });

    it('gets the full user settings', async () => {
      await UserSettingsService.init();

      const userSettings = await UserSettingsService.get();

      expect(userSettings).toEqual(DEFAULT_USER_SETTINGS);
    });
  });

  describe('write operations', () => {
    it('sets a value and communicates to the frontend', async () => {
      await UserSettingsService.set('qaMode', true);

      const qaMode = await UserSettingsService.get('qaMode');
      expect(qaMode).toBe(true);
      expect(
        (BrowserWindow as unknown as MockedBrowserWindow).sendFunction,
      ).toHaveBeenCalledWith(AllowedFrontendChannels.UserSettingsChanged, {
        qaMode: true,
      });
    });

    it('sets a value and does not communicates to the frontend if disabled', async () => {
      await UserSettingsService.set('qaMode', true, {
        skipNotification: true,
      });

      const qaMode = await UserSettingsService.get('qaMode');
      expect(qaMode).toBe(true);
      expect(
        (BrowserWindow as unknown as MockedBrowserWindow).sendFunction,
      ).not.toHaveBeenCalled();
    });

    it('allows to update multiple values at once', async () => {
      await UserSettingsService.init();

      await UserSettingsService.update({
        qaMode: true,
        showClassifications: false,
      });

      const userSettings = await UserSettingsService.get();

      expect(
        (BrowserWindow as unknown as MockedBrowserWindow).sendFunction,
      ).toHaveBeenCalledTimes(2);
      expect(userSettings).toEqual({
        ...DEFAULT_USER_SETTINGS,
        qaMode: true,
        showClassifications: false,
      });
    });
  });
});
