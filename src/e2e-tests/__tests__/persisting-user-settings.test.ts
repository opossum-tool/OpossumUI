// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { menuItemIds } from '../../ElectronBackend/main/menu/menuItemIds';
import { MenuBar } from '../page-objects/MenuBar';
import { test } from '../utils';

test.use({ playwrightTracing: false });

test('persists user settings across an app restart', async ({
  menuBar,
  relaunch,
}) => {
  const qaModeIconUnchecked = await menuBar.getMenuItemIconReference(
    menuItemIds.qaMode,
  );
  const classificationIconChecked = await menuBar.getMenuItemIconReference(
    menuItemIds.showClassifications,
  );

  await menuBar.toggleQaMode();
  await menuBar.toggleShowClassification();

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
});
