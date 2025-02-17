// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { shell } from 'electron';

import { getIconBasedOnTheme } from '../iconHelpers';
import {
  getPathOfChromiumNoticeDocument,
  getPathOfNoticeDocument,
} from '../notice-document-helpers';

function getOpenOnGithub() {
  return {
    icon: getIconBasedOnTheme(
      'icons/github-white.png',
      'icons/github-black.png',
    ),
    label: 'Open on GitHub',
    click: () =>
      shell.openExternal('https://github.com/opossum-tool/opossumUI'),
  };
}

function getOpossumUiNotices() {
  return {
    icon: getIconBasedOnTheme(
      'icons/notice-white.png',
      'icons/notice-black.png',
    ),
    label: 'OpossumUI Notices',
    click: () => shell.openPath(getPathOfNoticeDocument()),
  };
}

function getChromiumNotices() {
  return {
    icon: getIconBasedOnTheme(
      'icons/chromium-white.png',
      'icons/chromium-black.png',
    ),
    label: 'Chromium Notices',
    click: () => shell.openPath(getPathOfChromiumNoticeDocument()),
  };
}

export function getAboutMenu() {
  return {
    label: 'About',
    submenu: [getOpenOnGithub(), getOpossumUiNotices(), getChromiumNotices()],
  };
}
