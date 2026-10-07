// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T, fallback: T): T;
export function usePrevious<T>(value: T, fallback?: T): T | undefined;
export function usePrevious<T>(value: T, fallback?: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  // Reading the ref during render is intentional here: the ref is only ever
  // written in the effect above, so this returns the committed previous value.
  // eslint-disable-next-line @eslint-react/refs -- previous-value hooks must read the ref during render
  return ref.current ?? fallback;
}
