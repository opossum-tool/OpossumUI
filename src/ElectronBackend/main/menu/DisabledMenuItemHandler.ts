// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Menu } from 'electron';

export class DisabledMenuItemHandler {
  private static nextId: number = 0;

  static registerDisabledMenuItem(): string {
    const idString = DisabledMenuItemHandler.nextId.toString();
    DisabledMenuItemHandler.nextId++;
    return idString;
  }

  private static disabledIds(): Array<string> {
    return Array(DisabledMenuItemHandler.nextId)
      .keys()
      .map((id) => id.toString())
      .toArray();
  }

  static activateMenuItems(): void {
    const menu = Menu.getApplicationMenu();
    DisabledMenuItemHandler.disabledIds().forEach((id) => {
      const menuItem = menu?.getMenuItemById(id);
      if (menuItem) {
        menuItem.enabled = true;
      }
    });
  }
}
