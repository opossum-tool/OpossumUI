// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Makes sure that value ends up being array if not already an array
 * @param input
 */
export function ensureArray<T>(
  input: T | Array<T> | null | undefined,
): Array<T> {
  if (input === null || input === undefined) {
    return [];
  }

  return Array.isArray(input) ? input : [input];
}
