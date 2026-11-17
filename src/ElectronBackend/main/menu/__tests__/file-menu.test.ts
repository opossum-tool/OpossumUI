// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BrowserWindow,
  MenuItem,
  MenuItemConstructorOptions,
} from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { setGlobalBackendState } from '../../globalBackendState';
import { handleOpeningFile } from '../../listeners';
import { getFileMenu } from '../fileMenu';
import { menuItemIds } from '../menuItemIds';

const getUserSettingMock = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({ app: { quit: vi.fn() } }));
vi.mock('../../iconHelpers', () => ({ getIconBasedOnTheme: vi.fn() }));
vi.mock('../../listeners', () => ({
  handleOpeningFile: vi.fn(),
  importFileListener: vi.fn(),
  selectBaseURLListener: vi.fn(),
}));
vi.mock('../../user-settings-service', () => ({
  UserSettingsService: { get: getUserSettingMock, update: vi.fn() },
}));

function submenuOf(
  item: MenuItemConstructorOptions,
): Array<MenuItemConstructorOptions> {
  if (!Array.isArray(item.submenu)) {
    throw new Error('Expected a menu template submenu');
  }
  return item.submenu;
}

test('routes recent projects through the renderer approval flow instead of loading directly', async () => {
  setGlobalBackendState({});
  const filePath = '/recent/project.opossum';
  getUserSettingMock.mockResolvedValue([filePath]);
  const send = vi.fn();
  const mainWindow = { webContents: { send } } as unknown as BrowserWindow;
  const fileMenu = await getFileMenu(mainWindow, vi.fn(), false);
  const openRecent = submenuOf(fileMenu).find(
    ({ id }) => id === menuItemIds.openRecent,
  )!;
  const recentProject = submenuOf(openRecent).find(
    ({ id }) => id === filePath,
  )!;

  recentProject.click!({ id: filePath } as MenuItem, mainWindow, {});

  expect(send).toHaveBeenCalledExactlyOnceWith(
    AllowedFrontendChannels.OpenFile,
    filePath,
  );
  expect(handleOpeningFile).not.toHaveBeenCalled();
});
