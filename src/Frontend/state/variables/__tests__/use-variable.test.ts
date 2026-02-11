// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import { useVariable } from '../use-variable';

describe('useVariable', () => {
  it('returns initial value', async () => {
    const key = faker.string.sample();
    const initialValue = faker.string.sample();
    const { result } = await renderHook(() => useVariable(key, initialValue));

    expect(result.current[0]).toBe(initialValue);
  });

  it('updates variable and persists it in store', async () => {
    const key = faker.string.sample();
    const initialValue = faker.string.sample();
    const newValue = faker.string.sample();
    const { result } = await renderHook(() => useVariable(key, initialValue));

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toBe(newValue);
  });
});
