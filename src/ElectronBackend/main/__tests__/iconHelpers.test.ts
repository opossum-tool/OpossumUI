// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Menu, MenuItem } from 'electron';

import { makeFirstIconVisibleAndSecondHidden } from '../iconHelpers';

jest.mock('electron', () => ({
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
    getApplicationMenu: jest.fn(),
  },
}));
jest.mock('electron-is-dev', () => false);

describe('makeFirstIconVisibleAndSecondHidden', () => {
  let toBeVisibleMenuItem: Partial<MenuItem>;
  let toBeHiddenMenuItem: Partial<MenuItem>;

  it('should make the first item visible and the second item hidden', () => {
    toBeVisibleMenuItem = { visible: false };
    toBeHiddenMenuItem = { visible: true };
    (Menu.getApplicationMenu as jest.Mock).mockImplementation(() => ({
      getMenuItemById: jest.fn().mockImplementation((id) => {
        if (id === 'toBeVisibleMenuItem') return toBeVisibleMenuItem;
        if (id === 'toBeHiddenMenuItem') return toBeHiddenMenuItem;
        throw Error('unexpected ID');
      }),
    }));

    makeFirstIconVisibleAndSecondHidden(
      'toBeVisibleMenuItem',
      'toBeHiddenMenuItem',
    );

    expect(toBeVisibleMenuItem.visible).toBe(true);
    expect(toBeHiddenMenuItem.visible).toBe(false);
  });
});
