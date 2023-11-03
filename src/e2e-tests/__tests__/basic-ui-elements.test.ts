// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '../utils';

test.describe('OpossumUI', () => {
  test('displays correct app title', async ({ window }) => {
    expect(await window.title()).toBe('OpossumUI');
  });

  test('displays view buttons', async ({ window }) => {
    await expect(window.getByText('Audit')).toBeVisible();
    await expect(window.getByText('Attribution')).toBeVisible();
    await expect(window.getByText('Report')).toBeVisible();
  });
});
