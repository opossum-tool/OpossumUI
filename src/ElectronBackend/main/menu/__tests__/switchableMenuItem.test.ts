// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { UserSettingsService } from '../../user-settings-service';
import { switchableMenuItem } from '../switchableMenuItem';

vi.mock('../../iconHelpers', () => ({
  getCheckboxBasedOnThemeAndCheckState: (checked: boolean): string =>
    checked ? 'checked-icon' : 'unchecked-icon',
}));

vi.mock('../../user-settings-service', () => ({
  UserSettingsService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

const mockedGet = UserSettingsService.get as unknown as Mock;
const mockedUpdate = UserSettingsService.update as unknown as Mock;

describe('switchableMenuItem', () => {
  const options = {
    id: 'qa-mode',
    label: 'QA Mode',
    userSettingsKey: 'qaMode' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGet.mockResolvedValue(false);
    mockedUpdate.mockResolvedValue(undefined);
  });

  it('builds the item with the icon reflecting the current state', async () => {
    mockedGet.mockResolvedValue(true);

    const item = await switchableMenuItem(vi.fn(), options);

    expect(item.id).toBe('qa-mode');
    expect(item.label).toBe('QA Mode');
    expect(item.icon).toBe('checked-icon');
  });

  it('updates the menu icon when the state changes', async () => {
    const item = await switchableMenuItem(vi.fn(), options);

    expect(item.icon).toBe('unchecked-icon');
  });

  it('inverts the current state on click and rebuilds the menu', async () => {
    mockedGet.mockResolvedValue(true);
    const updateMenu = vi.fn().mockResolvedValue(undefined);

    const item = await switchableMenuItem(updateMenu, options);
    const click = item.click as unknown as () => Promise<void>;
    await click();

    expect(mockedUpdate).toHaveBeenCalledTimes(1);
    expect(mockedUpdate).toHaveBeenCalledWith({ qaMode: false });
    expect(updateMenu).toHaveBeenCalledTimes(1);
  });

  it('enables the setting on click if it was previously unset', async () => {
    mockedGet.mockResolvedValue(undefined);
    const updateMenu = vi.fn().mockResolvedValue(undefined);

    const item = await switchableMenuItem(updateMenu, options);
    const click = item.click as unknown as () => Promise<void>;
    await click();

    expect(mockedUpdate).toHaveBeenCalledWith({ qaMode: true });
    expect(updateMenu).toHaveBeenCalledTimes(1);
  });
});
