// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isFunction } from 'lodash';
import { DependencyList, useCallback, useEffect } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { UserSettings } from '../../../shared/shared-types';
import { useIpcRenderer } from '../../util/use-ipc-renderer';
import { useVariable } from './use-variable';

/**
 * Use this hook to get and set app-wide user settings.
 * @param props Specify the user setting key and its default value while hydrating.
 * @param deps Dependency array of the hook.
 * @returns A tuple containing the current value, a setter function and a boolean indicating whether the value has been hydrated.
 */
export function useUserSetting<T extends keyof UserSettings>(
  { defaultValue, key }: { defaultValue?: never; key: T },
  deps?: DependencyList,
): [UserSettings[T], (newValue: UserSettings[T]) => void, boolean];
export function useUserSetting<T extends keyof UserSettings>(
  { defaultValue, key }: { defaultValue: NonNullable<UserSettings[T]>; key: T },
  deps?: DependencyList,
): [
  NonNullable<UserSettings[T]>,
  (
    newValue:
      | UserSettings[T]
      | ((prev: NonNullable<UserSettings[T]>) => UserSettings[T]),
  ) => void,
  boolean,
];
export function useUserSetting<T extends keyof UserSettings>(
  { defaultValue, key }: { defaultValue?: UserSettings[T]; key: T },
  deps: DependencyList = [],
): [UserSettings[T] | undefined, (newValue: UserSettings[T]) => void, boolean] {
  const [{ hydrated, storedValue }, setVariable] = useVariable(key, {
    hydrated: false,
    storedValue: defaultValue,
  });

  const setStoredValue = useCallback(
    (
      newValue:
        | UserSettings[T]
        | ((prev: UserSettings[T] | undefined) => UserSettings[T]),
    ): void => {
      setVariable((prev) => {
        const effectiveNewValue = isFunction(newValue)
          ? newValue(prev.storedValue)
          : newValue;
        void window.electronAPI.setUserSetting(key, effectiveNewValue);
        return {
          hydrated: true,
          storedValue: effectiveNewValue ?? defaultValue,
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  const readStoredValue = useCallback(
    async (): Promise<UserSettings[T] | undefined> => {
      const value = await window.electronAPI.getUserSetting(key);

      return value ?? defaultValue;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    void (async (): Promise<void> => {
      const storedValue = await readStoredValue();
      storedValue !== undefined && setStoredValue(storedValue);
    })();
  }, [readStoredValue, setStoredValue]);

  useIpcRenderer(
    AllowedFrontendChannels.UserSettingsChanged,
    async () =>
      setVariable({
        hydrated: true,
        storedValue: await readStoredValue(),
      }),
    [readStoredValue],
  );

  return [storedValue, setStoredValue, hydrated];
}
