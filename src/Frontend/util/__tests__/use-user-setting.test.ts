// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';

import { faker } from '../../../shared/Faker';
import { ElectronAPI } from '../../../shared/shared-types';
import { renderHook } from '../../test-helpers/render-component-with-store';
import { useUserSetting } from '../use-user-setting';

const mockGetUserSetting = jest.fn();
const mockSetUserSetting = jest.fn();

const electronAPI: Pick<ElectronAPI, 'setUserSetting' | 'getUserSetting'> = {
  getUserSetting: mockGetUserSetting,
  setUserSetting: mockSetUserSetting,
};

describe('useUserSetting', () => {
  beforeEach(() => {
    window.electronAPI = electronAPI as ElectronAPI;
  });

  function extract(result: { current: ReturnType<typeof useUserSetting> }) {
    return {
      value: result.current[0],
      setValue: result.current[1],
      hydrated: result.current[2],
    };
  }

  it('returns default value when no stored value exist', async () => {
    const defaultValue = faker.datatype.boolean();
    const { result } = renderHook(() =>
      useUserSetting({ key: 'showProjectStatistics', defaultValue }),
    );

    await waitFor(() => expect(extract(result).hydrated).toBe(true));

    expect(extract(result).value).toBe(defaultValue);
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

    expect(extract(result).value).toBe(defaultValue);
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

    await waitFor(() => expect(extract(result).hydrated).toBe(true));

    expect(extract(result).value).toBe(storedValue);
    expect(mockGetUserSetting).toHaveBeenCalledTimes(1);
    expect(mockSetUserSetting).toHaveBeenCalledTimes(1);
  });

  it('updates user setting', async () => {
    const defaultValue = faker.datatype.boolean();
    const newValue = !defaultValue;
    const { result } = renderHook(() =>
      useUserSetting({ key: 'showProjectStatistics', defaultValue }),
    );

    await waitFor(() => expect(extract(result).hydrated).toBe(true));
    await act(async () => {
      await extract(result).setValue(newValue);
    });

    expect(extract(result).value).toBe(newValue);
    expect(mockGetUserSetting).toHaveBeenCalledTimes(1);
    expect(mockSetUserSetting).toHaveBeenCalledTimes(2);
  });
});
