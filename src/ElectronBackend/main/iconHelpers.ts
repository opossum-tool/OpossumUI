// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import electron from 'electron';
import path from 'path';

import { getBasePathOfAssets, getBasePathOfIcons } from './getPath';

export function getIconPath(): string {
  return path.join(getBasePathOfIcons(), 'icon_512x512.png');
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
