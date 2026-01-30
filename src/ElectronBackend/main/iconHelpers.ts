// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import electron, { app } from 'electron';
import path from 'path';
import upath from 'upath';

import { getBasePathOfAssets } from './getPath';

export function getIconPath(): string {
  const basePath = app.isPackaged
    ? path.join(upath.toUnix(__dirname), '..')
    : path.join(upath.toUnix(__dirname), '..', '..', 'public');
  return path.join(basePath, 'icons', 'icon_512x512.png');
}

export function getIconBasedOnTheme(
  white_icon: string,
  black_icon: string,
): string {
  return electron.nativeTheme?.shouldUseDarkColors
    ? path.join(getBasePathOfAssets(), white_icon)
    : path.join(getBasePathOfAssets(), black_icon);
}

export function getCheckboxBasedOnThemeAndCheckState(checked: boolean): string {
  if (checked) {
    return getIconBasedOnTheme(
      'icons/check-box-white.png',
      'icons/check-box-black.png',
    );
  }

  return getIconBasedOnTheme(
    'icons/check-box-blank-white.png',
    'icons/check-box-blank-black.png',
  );
}
