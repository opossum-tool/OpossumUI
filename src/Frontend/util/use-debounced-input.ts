// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

const default_delay = 500;

export function useDebouncedInput<T>(input: T, delay = default_delay): T {
  const [debouncedInput, setDebouncedInput] = useState<T>(input);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInput(input);
    }, delay);

    return (): void => {
      clearTimeout(handler);
    };
  }, [delay, input]);

  return debouncedInput;
}
