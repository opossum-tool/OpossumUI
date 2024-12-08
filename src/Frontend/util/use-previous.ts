// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T, fallback: T): T;
export function usePrevious<T>(value: T, fallback?: T): T | undefined;
export function usePrevious<T>(value: T, fallback?: T): T | undefined {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current ?? fallback;
}
