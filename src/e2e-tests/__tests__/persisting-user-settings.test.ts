// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { menuItemIds } from '../../ElectronBackend/main/menu/menuItemIds';
import type { ElectronAPI } from '../../shared/shared-types';
import { MenuBar } from '../page-objects/MenuBar';
import { test } from '../utils';

test.use({ playwrightTracing: false });

test('persists user settings across an app restart', async ({
  menuBar,
  relaunch,
  window,
}) => {
  const qaModeIconUnchecked = await menuBar.getMenuItemIconReference(
    menuItemIds.qaMode,
  );
  const classificationIconChecked = await menuBar.getMenuItemIconReference(
    menuItemIds.showClassifications,
  );
  await menuBar.toggleQaMode();
  await menuBar.toggleShowClassification();
  await menuBar.toggleAutomaticUpdateChecks();
  await expect
    .poll(() =>
      window.evaluate(() =>
        (
          globalThis as unknown as { electronAPI: ElectronAPI }
        ).electronAPI.getUserSettings(),
      ),
    )
    .toMatchObject({ automaticallyCheckForUpdates: false });
  await menuBar.toggleAutomaticUpdateChecks();
  await expect
    .poll(() =>
      window.evaluate(() =>
        (
          globalThis as unknown as { electronAPI: ElectronAPI }
        ).electronAPI.getUserSettings(),
      ),
    )
    .toMatchObject({ automaticallyCheckForUpdates: true });
  await menuBar.toggleAutomaticUpdateChecks();
  await expect
    .poll(() =>
      window.evaluate(() =>
        (
          globalThis as unknown as { electronAPI: ElectronAPI }
        ).electronAPI.getUserSettings(),
      ),
    )
    .toMatchObject({ automaticallyCheckForUpdates: false });

  await expect
    .poll(() => menuBar.getMenuItemIconReference(menuItemIds.qaMode))
    .not.toBe(qaModeIconUnchecked);
  const qaModeIconChecked = await menuBar.getMenuItemIconReference(
    menuItemIds.qaMode,
  );

  await expect
    .poll(() =>
      menuBar.getMenuItemIconReference(menuItemIds.showClassifications),
    )
    .not.toBe(classificationIconChecked);
  const classificationIconUnchecked = await menuBar.getMenuItemIconReference(
    menuItemIds.showClassifications,
  );

  const relaunchedWindow = await relaunch();
  const relaunchedMenuBar = new MenuBar(relaunchedWindow);

  await expect
    .poll(() => relaunchedMenuBar.getMenuItemIconReference(menuItemIds.qaMode))
    .toBe(qaModeIconChecked);
  await expect
    .poll(() =>
      relaunchedMenuBar.getMenuItemIconReference(
        menuItemIds.showClassifications,
      ),
    )
    .toBe(classificationIconUnchecked);
  await expect
    .poll(() =>
      relaunchedWindow.evaluate(() =>
        (
          globalThis as unknown as { electronAPI: ElectronAPI }
        ).electronAPI.getUserSettings(),
      ),
    )
    .toMatchObject({ automaticallyCheckForUpdates: false });
});
