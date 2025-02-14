// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { isFileLoaded } from '../../utils/getLoadedFile';
import { getGlobalBackendState } from '../globalBackendState';
import { getIconBasedOnTheme } from '../iconHelpers';
import { INITIALLY_DISABLED_ITEMS_INFO } from './initiallyDisabledMenuItems';

const UNDO: MenuItemConstructorOptions = {
  icon: getIconBasedOnTheme('icons/undo-white.png', 'icons/undo-black.png'),
  label: 'Undo',
  accelerator: 'CmdOrCtrl+Z',
  role: 'undo',
};

const REDO: MenuItemConstructorOptions = {
  icon: getIconBasedOnTheme('icons/redo-white.png', 'icons/redo-black.png'),
  label: 'Redo',
  accelerator: 'Shift+CmdOrCtrl+Z',
  role: 'redo',
};

const CUT: MenuItemConstructorOptions = {
  icon: getIconBasedOnTheme('icons/cut-white.png', 'icons/cut-black.png'),
  label: 'Cut',
  accelerator: 'CmdOrCtrl+X',
  role: 'cut',
};

const COPY: MenuItemConstructorOptions = {
  icon: getIconBasedOnTheme('icons/copy-white.png', 'icons/copy-black.png'),
  label: 'Copy',
  accelerator: 'CmdOrCtrl+C',
  role: 'copy',
};

const PASTE: MenuItemConstructorOptions = {
  icon: getIconBasedOnTheme('icons/paste-white.png', 'icons/paste-black.png'),
  label: 'Paste',
  accelerator: 'CmdOrCtrl+V',
  role: 'paste',
};

const SELECT_ALL: MenuItemConstructorOptions = {
  icon: getIconBasedOnTheme(
    'icons/select-all-white.png',
    'icons/select-all-black.png',
  ),
  label: INITIALLY_DISABLED_ITEMS_INFO.selectAll.label,
  accelerator: 'CmdOrCtrl+A',
  role: 'selectAll',
  id: INITIALLY_DISABLED_ITEMS_INFO.selectAll.id,
  enabled: false,
};

function getSearchAttributions(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme(
      'icons/magnifying-glass-white.png',
      'icons/magnifying-glass-black.png',
    ),
    label: INITIALLY_DISABLED_ITEMS_INFO.searchAttributions.label,
    accelerator: 'CmdOrCtrl+Shift+A',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchAttributions);
      }
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.searchAttributions.id,
    enabled: false,
  };
}

function getSearchSignals(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme(
      'icons/magnifying-glass-white.png',
      'icons/magnifying-glass-black.png',
    ),
    label: INITIALLY_DISABLED_ITEMS_INFO.searchSignals.label,
    accelerator: 'CmdOrCtrl+Shift+S',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchSignals);
      }
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.searchSignals.id,
    enabled: false,
  };
}

function getSearchResources(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme(
      'icons/search-white.png',
      'icons/search-black.png',
    ),
    label: INITIALLY_DISABLED_ITEMS_INFO.searchResourcesAll.label,
    accelerator: 'CmdOrCtrl+Shift+R',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchResources);
      }
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.searchResourcesAll.id,
    enabled: false,
  };
}

function getSearchLinkedResources(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme(
      'icons/search-white.png',
      'icons/search-black.png',
    ),
    label: INITIALLY_DISABLED_ITEMS_INFO.searchResourceLinked.label,
    accelerator: 'CmdOrCtrl+Shift+L',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchLinkedResources);
      }
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.searchResourceLinked.id,
    enabled: false,
  };
}

export function getEditMenu(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    label: 'Edit',
    submenu: [
      UNDO,
      REDO,
      { type: 'separator' },
      CUT,
      COPY,
      PASTE,
      SELECT_ALL,
      { type: 'separator' },
      getSearchAttributions(webContents),
      getSearchSignals(webContents),
      getSearchResources(webContents),
      getSearchLinkedResources(webContents),
    ],
  };
}
