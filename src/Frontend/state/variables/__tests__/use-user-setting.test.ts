// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { ElectronAPI } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import { useUserSetting } from '../use-user-setting';

const mockGetUserSetting = jest.fn();
const mockSetUserSetting = jest.fn();

const electronAPI: Pick<
  ElectronAPI,
  'setUserSetting' | 'getUserSetting' | 'on'
> = {
  getUserSetting: mockGetUserSetting,
  setUserSetting: mockSetUserSetting,
  on: jest.fn().mockReturnValue(jest.fn()),
};

describe('useUserSetting', () => {
  beforeEach(() => {
    window.electronAPI = electronAPI as ElectronAPI;
  });

  it('returns default value when no stored value exist', async () => {
    const defaultValue = faker.datatype.boolean();
    const { result } = renderHook(() =>
      useUserSetting({ key: 'showProjectStatistics', defaultValue }),
    );

    await waitFor(() => expect(result.current[2]).toBe(true));

    expect(result.current[0]).toBe(defaultValue);
    expect(mockGetUserSetting).toHaveBeenCalledTimes(1);
    expect(mockSetUserSetting).toHaveBeenCalledTimes(1);
  });

  it('returns default value as long as not hydrated', () => {
    const defaultValue = faker.datatype.boolean();
    const storedValue = !defaultValue;
    mockGetUserSetting.mockReturnValue(storedValue);
    const { result } = renderHook(() =>
      useUserSetting({ key: 'showProjectStatistics', defaultValue }),
    );

    expect(result.current[0]).toBe(defaultValue);
    expect(mockGetUserSetting).toHaveBeenCalledTimes(1);
    expect(mockSetUserSetting).not.toHaveBeenCalled();
  });

  it('returns stored value', async () => {
    const defaultValue = faker.datatype.boolean();
    const storedValue = !defaultValue;
    mockGetUserSetting.mockReturnValue(storedValue);
    const { result } = renderHook(() =>
      useUserSetting({ key: 'showProjectStatistics', defaultValue }),
    );

    await waitFor(() => expect(result.current[2]).toBe(true));

    expect(result.current[0]).toBe(storedValue);
    expect(mockGetUserSetting).toHaveBeenCalledTimes(1);
    expect(mockSetUserSetting).toHaveBeenCalledTimes(1);
  });

  it('updates user setting', async () => {
    const defaultValue = faker.datatype.boolean();
    const newValue = !defaultValue;
    const { result } = renderHook(() =>
      useUserSetting({ key: 'showProjectStatistics', defaultValue }),
    );

    await waitFor(() => expect(result.current[2]).toBe(true));
    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toBe(newValue);
    expect(mockGetUserSetting).toHaveBeenCalledTimes(1);
    expect(mockSetUserSetting).toHaveBeenCalledTimes(2);
  });
});
