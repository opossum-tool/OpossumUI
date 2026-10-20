// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { menuItemIds } from '../../ElectronBackend/main/menu/menuItemIds';
import { test } from '../utils';

test('shows the default window title when no file is open', async ({
  menuBar,
}) => {
  // The renderer-covered behavior of this no-file scenario lives in
  // src/Frontend/integration-tests/using-app-without-a-file.test.tsx.
  // The native window title is not observable there, so it is checked here.
  await menuBar.assert.hasTitle('OpossumUI');
});

test('does not open popups when the popup menu items are clicked without a file', async ({
  menuBar,
  window,
}) => {
  // clickMenuItemById invokes the click handler even for disabled items,
  // so this exercises the isFileLoaded guards in the click handlers.
  await menuBar.forceClickMenuItem(menuItemIds.projectMetadata);
  await menuBar.forceClickMenuItem(menuItemIds.projectStatistics);

  await expect(window.getByLabel('project metadata')).toHaveCount(0);
  await expect(window.getByLabel('project statistics')).toHaveCount(0);
  await menuBar.assert.hasTitle('OpossumUI');
});
