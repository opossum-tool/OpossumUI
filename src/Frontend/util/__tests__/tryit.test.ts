// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../shared/Faker';
import { tryit } from '../tryit';

describe('tryit', () => {
  it('converts error to undefined', async () => {
    expect(await tryit(() => Promise.reject())()).toBeUndefined();
  });

  it('yields return value when no error occurs', async () => {
    const value = faker.string.sample();
    expect(await tryit(() => Promise.resolve(value))()).toBe(value);
  });
});
