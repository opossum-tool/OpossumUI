// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Converts a function that might throw an error into a function that returns undefined instead.
 * @param func The function that might throw an error. It can be async.
 * @returns
 */
export function tryit<A extends Array<unknown>, R>(
  func: (...args: A) => R,
): (
  ...args: A
) => R extends Promise<infer P> ? Promise<P | undefined> : R | undefined {
  //@ts-expect-error fixing this type error would just repeat the definition above
  return (...args) => {
    try {
      return func(...args);
    } catch (error) {
      return undefined;
    }
  };
}
