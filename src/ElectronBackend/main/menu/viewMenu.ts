// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions } from 'electron';

import { text } from '../../../shared/text';
import { getIconBasedOnTheme } from '../iconHelpers';
import { UserSettings } from '../user-settings';
import { switchableMenuItem } from './switchableMenuItem';

function getShowDevTools(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/developer-tool-white.png',
      'icons/developer-tool-black.png',
    ),
    label: text.menu.viewSubmenu.showDevTools,
    role: 'toggleDevTools',
  };
}

function getToggleFullScreen(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/full-screen-white.png',
      'icons/full-screen-black.png',
    ),
    label: text.menu.viewSubmenu.toggleFullScreen,
    role: 'togglefullscreen',
  };
}

function getZoomIn(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/zoom-in-white.png',
      'icons/zoom-in-black.png',
    ),
    label: text.menu.viewSubmenu.zoomIn,
    role: 'zoomIn',
  };
}

function getZoomOut(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/zoom-out-white.png',
      'icons/zoom-out-black.png',
    ),
    label: text.menu.viewSubmenu.zoomOut,
    role: 'zoomOut',
  };
}

function getShowClassifications(
  showClassifications: boolean | null,
): Array<MenuItemConstructorOptions> {
  return switchableMenuItem(showClassifications, {
    id: 'show-classifications',
    label: text.menu.viewSubmenu.showClassifications,
    onToggle: (newState: boolean) =>
      UserSettings.set('showClassifications', newState),
  });
}

function getShowCriticality(
  showClassifications: boolean | null,
): Array<MenuItemConstructorOptions> {
  return switchableMenuItem(showClassifications, {
    id: 'show-criticality',
    label: text.menu.viewSubmenu.showCriticality,
    onToggle: (newState: boolean) =>
      UserSettings.set('showCriticality', newState),
  });
}

function getQaMode(qaMode: boolean | null): Array<MenuItemConstructorOptions> {
  return switchableMenuItem(qaMode, {
    id: 'qa-mode',
    label: text.menu.viewSubmenu.qaMode,
    onToggle: (newState: boolean) => UserSettings.set('qaMode', newState),
  });
}

export async function getViewMenu(): Promise<MenuItemConstructorOptions> {
  const qaMode = await UserSettings.get('qaMode');
  const showCriticality = await UserSettings.get('showCriticality');
  const showClassifications = await UserSettings.get('showClassifications');
  return {
    label: text.menu.view,
    submenu: [
      getShowDevTools(),
      getToggleFullScreen(),
      getZoomIn(),
      getZoomOut(),
      ...getQaMode(qaMode),
      ...getShowCriticality(showCriticality),
      ...getShowClassifications(showClassifications),
    ],
  };
}
