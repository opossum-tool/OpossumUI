// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions } from 'electron';

import {
  getIconBasedOnTheme,
  makeFirstIconVisibleAndSecondHidden,
} from '../iconHelpers';
import { UserSettings } from '../user-settings';

function getShowDevTools(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/developer-tool-white.png',
      'icons/developer-tool-black.png',
    ),
    label: 'Show Developer Tools',
    role: 'toggleDevTools',
  };
}

function getToggleFullScreen(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/full-screen-white.png',
      'icons/full-screen-black.png',
    ),
    label: 'Full Screen',
    role: 'togglefullscreen',
  };
}

function getZoomIn(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/zoom-in-white.png',
      'icons/zoom-in-black.png',
    ),
    label: 'Zoom In',
    role: 'zoomIn',
  };
}

function getZoomOut(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/zoom-out-white.png',
      'icons/zoom-out-black.png',
    ),
    label: 'Zoom Out',
    role: 'zoomOut',
  };
}

function getEnableQaMode(qaMode: null | boolean) {
  return {
    icon: getIconBasedOnTheme(
      'icons/check-box-blank-white.png',
      'icons/check-box-blank-black.png',
    ),
    label: 'QA Mode',
    id: 'disabled-qa-mode',
    click: () => {
      makeFirstIconVisibleAndSecondHidden(
        'enabled-qa-mode',
        'disabled-qa-mode',
      );
      void UserSettings.set('qaMode', true);
    },
    visible: !qaMode,
  };
}

function getDisableQaMode(qaMode: null | boolean) {
  return {
    icon: getIconBasedOnTheme(
      'icons/check-box-white.png',
      'icons/check-box-black.png',
    ),
    label: 'QA Mode',
    id: 'enabled-qa-mode',
    click: () => {
      makeFirstIconVisibleAndSecondHidden(
        'disabled-qa-mode',
        'enabled-qa-mode',
      );
      void UserSettings.set('qaMode', false);
    },
    visible: !!qaMode,
  };
}

export async function getViewMenu(): Promise<MenuItemConstructorOptions> {
  const qaMode = await UserSettings.get('qaMode');

  return {
    label: 'View',
    submenu: [
      getShowDevTools(),
      getToggleFullScreen(),
      getZoomIn(),
      getZoomOut(),
      getEnableQaMode(qaMode),
      getDisableQaMode(qaMode),
    ],
  };
}
