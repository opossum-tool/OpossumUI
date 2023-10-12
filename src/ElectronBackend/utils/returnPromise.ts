// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export async function returnPromiseOfData<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asyncFunction: (...args: Array<any>) => void,
  ...args: Array<unknown>
): Promise<T> {
  return new Promise((resolve): void => {
    asyncFunction(...args, (err: unknown, data: T): void => {
      if (err) throw err;
      resolve(data);
    });
  });
}

export async function returnPromiseOfVoid(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  asyncFunction: (...args: Array<any>) => void,
  ...args: Array<unknown>
): Promise<void> {
  return new Promise((resolve): void => {
    asyncFunction(...args, (err: unknown): void => {
      if (err) throw err;
      resolve();
    });
  });
}
