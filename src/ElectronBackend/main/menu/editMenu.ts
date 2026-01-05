// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { isFileLoaded } from '../../utils/getLoadedFile';
import { getGlobalBackendState } from '../globalBackendState';
import { getIconBasedOnTheme } from '../iconHelpers';

function getUndo(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/undo-white.png', 'icons/undo-black.png'),
    label: text.menu.editSubmenu.undo,
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo',
    enabled: !getGlobalBackendState().frontendPopupOpen,
  };
}

function getRedo(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/redo-white.png', 'icons/redo-black.png'),
    label: text.menu.editSubmenu.redo,
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo',
    enabled: !getGlobalBackendState().frontendPopupOpen,
  };
}

function getCut(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/cut-white.png', 'icons/cut-black.png'),
    label: text.menu.editSubmenu.cut,
    accelerator: 'CmdOrCtrl+X',
    role: 'cut',
  };
}

function getCopy(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/copy-white.png', 'icons/copy-black.png'),
    label: text.menu.editSubmenu.copy,
    accelerator: 'CmdOrCtrl+C',
    role: 'copy',
  };
}

function getPaste(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/paste-white.png', 'icons/paste-black.png'),
    label: text.menu.editSubmenu.paste,
    accelerator: 'CmdOrCtrl+V',
    role: 'paste',
  };
}

function getSelectAll(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/select-all-white.png',
      'icons/select-all-black.png',
    ),
    label: text.menu.editSubmenu.selectAll,
    accelerator: 'CmdOrCtrl+A',
    role: 'selectAll',
    enabled: isFileLoaded(getGlobalBackendState()),
  };
}

function getSearchAttributions(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/magnifying-glass-white.png',
      'icons/magnifying-glass-black.png',
    ),
    label: text.menu.editSubmenu.searchAttributions,
    accelerator: 'CmdOrCtrl+Shift+A',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchAttributions);
      }
    },
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
  };
}

function getSearchSignals(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/magnifying-glass-white.png',
      'icons/magnifying-glass-black.png',
    ),
    label: text.menu.editSubmenu.searchSignals,
    accelerator: 'CmdOrCtrl+Shift+S',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchSignals);
      }
    },
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
  };
}

function getSearchResources(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/search-white.png',
      'icons/search-black.png',
    ),
    label: text.menu.editSubmenu.searchResourcesAll,
    accelerator: 'CmdOrCtrl+Shift+R',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchResources);
      }
    },
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
  };
}

function getSearchLinkedResources(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/search-white.png',
      'icons/search-black.png',
    ),
    label: text.menu.editSubmenu.searchResourceLinked,
    accelerator: 'CmdOrCtrl+Shift+L',
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.SearchLinkedResources);
      }
    },
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
  };
}

export function getEditMenu(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    label: text.menu.edit,
    submenu: [
      getUndo(),
      getRedo(),
      { type: 'separator' },
      getCut(),
      getCopy(),
      getPaste(),
      getSelectAll(),
      { type: 'separator' },
      getSearchAttributions(webContents),
      getSearchSignals(webContents),
      getSearchResources(webContents),
      getSearchLinkedResources(webContents),
    ],
  };
}
