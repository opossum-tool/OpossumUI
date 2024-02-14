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
  {
    pluralNoun,
    showOne,
  }: Partial<{ pluralNoun: string; showOne: boolean }> = {},
) {
  if (count === 1) {
    return showOne ? `${count} ${noun}` : noun;
  }
  return `${new Intl.NumberFormat().format(count)} ${pluralNoun || `${noun}s`}`;
}
