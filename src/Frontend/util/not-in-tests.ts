// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function notInTests<T>(value: T): T | undefined {
  return window?.process?.env.JEST_WORKER_ID ? undefined : value;
}
