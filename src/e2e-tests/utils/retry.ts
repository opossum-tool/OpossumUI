// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const RETRY_COUNT = 3;

export async function retry({
  times = RETRY_COUNT,
  fn,
  onError,
}: {
  times?: number;
  fn: () => Promise<void>;
  onError?: () => Promise<unknown>;
}): Promise<void> {
  let error;

  for (let i = 0; i < times; i++) {
    try {
      await fn();
      return;
    } catch (e) {
      error = e;
      await onError?.();
    }
  }

  throw error;
}
