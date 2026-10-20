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
  await menuBar.toggleQaMode();
  await menuBar.toggleShowClassification();

  const qaModeIconChecked = await menuBar.getMenuItemIconReference(
    menuItemIds.qaMode,
  );
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
