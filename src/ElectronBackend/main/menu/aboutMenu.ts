// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions, shell } from 'electron';

import { text } from '../../../shared/text';
import { getIconBasedOnTheme } from '../iconHelpers';
import {
  getPathOfChromiumNoticeDocument,
  getPathOfNoticeDocument,
} from '../notice-document-helpers';

function getOpenOnGithub(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/github-white.png',
      'icons/github-black.png',
    ),
    label: text.menu.aboutSubmenu.openOnGithub,
    click: () =>
      shell.openExternal('https://github.com/opossum-tool/opossumUI'),
  };
}

function getOpossumUiNotices(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/notice-white.png',
      'icons/notice-black.png',
    ),
    label: text.menu.aboutSubmenu.opossumUINotices,
    click: () => shell.openPath(getPathOfNoticeDocument()),
  };
}

function getChromiumNotices(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/chromium-white.png',
      'icons/chromium-black.png',
    ),
    label: text.menu.aboutSubmenu.chromiumNotices,
    click: () => shell.openPath(getPathOfChromiumNoticeDocument()),
  };
}

export function getAboutMenu(): MenuItemConstructorOptions {
  return {
    label: text.menu.about,
    submenu: [getOpenOnGithub(), getOpossumUiNotices(), getChromiumNotices()],
  };
}
