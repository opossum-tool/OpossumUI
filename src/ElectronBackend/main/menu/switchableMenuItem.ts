// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItemConstructorOptions } from 'electron';

import {
  getCheckboxBasedOnThemeAndCheckState,
  makeFirstIconVisibleAndSecondHidden,
} from '../iconHelpers';

export interface SwitchableItemOptions {
  id: string;
  label: string;
  onToggle: (newState: boolean) => Promise<void>;
}

export function switchableMenuItem(
  initialState: null | boolean,
  options: SwitchableItemOptions,
): Array<MenuItemConstructorOptions> {
  const disabledEntry: MenuItemConstructorOptions = {
    icon: getCheckboxBasedOnThemeAndCheckState(false),
    id: `disabled-${options.id}`,
    visible: !initialState,
    label: options.label,
    click: () => {
      makeFirstIconVisibleAndSecondHidden(
        `enabled-${options.id}`,
        `disabled-${options.id}`,
      );
      void options.onToggle(true);
    },
  };
  const enabledEntry: MenuItemConstructorOptions = {
    icon: getCheckboxBasedOnThemeAndCheckState(true),
    id: `enabled-${options.id}`,
    label: options.label,
    visible: !!initialState,
    click: () => {
      makeFirstIconVisibleAndSecondHidden(
        `disabled-${options.id}`,
        `enabled-${options.id}`,
      );
      void options.onToggle(false);
    },
  };
  return [disabledEntry, enabledEntry];
}
