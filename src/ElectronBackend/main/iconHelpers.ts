// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import electron, { Menu } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import upath from 'upath';

import { getBasePathOfAssets } from './getPath';

export function getIconPath(): string {
  const basePath = isDev
    ? path.join(upath.toUnix(__dirname), '../../../public')
    : path.join(upath.toUnix(__dirname), '../..');
  return path.join(basePath, 'icons/icon_512x512.png');
}

export function getIconBasedOnTheme(
  white_icon: string,
  black_icon: string,
): string {
  return electron.nativeTheme?.shouldUseDarkColors
    ? path.join(getBasePathOfAssets(), white_icon)
    : path.join(getBasePathOfAssets(), black_icon);
}

export function makeFirstIconVisibleAndSecondHidden(
  firstItemId: string,
  secondItemId: string,
): void {
  const itemToMakeVisible =
    Menu.getApplicationMenu()?.getMenuItemById(firstItemId);
  if (itemToMakeVisible) itemToMakeVisible.visible = true;
  const itemToHide = Menu.getApplicationMenu()?.getMenuItemById(secondItemId);
  if (itemToHide) itemToHide.visible = false;
}
