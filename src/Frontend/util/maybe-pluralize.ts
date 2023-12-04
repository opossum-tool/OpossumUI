// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Adds 's' depending on value, for example user vs users
 * @param count
 * @param noun
 * @param pluralNoun
 * @example maybePluralize(0, 'User') returns '0 Users'
 */
export function maybePluralize(
  count: number,
  noun: string,
  { pluralNoun }: Partial<{ pluralNoun: string }> = {},
) {
  return `${count} ${count === 1 ? noun : pluralNoun || `${noun}s`}`;
}
