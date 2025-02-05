// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function ensureArray<T>(elementOrArray: T | Array<T>): Array<T> {
  if (Array.isArray(elementOrArray)) {
    return elementOrArray;
  }
  if (elementOrArray === undefined) {
    return [];
  }
  return [elementOrArray];
}
