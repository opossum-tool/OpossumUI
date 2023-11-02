// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '../utils';

test.use({
  file: 'src/e2e-tests/assets/opossum_input_e2e.json',
});

test.describe('OpossumUI with deprecated file', () => {
  test('opens file and displays signals', async ({ window }) => {
    await window.getByRole('button', { name: 'Keep' }).click();
    await expect(window.getByText('Frontend')).toBeVisible();
    await window.getByText('Close').click();

    await window.getByText('ElectronBackend').click();
    await expect(window.getByText('jQuery, 16.13.1')).toBeVisible();
  });

  test('hides signals in accordion', async ({ window }) => {
    await window.getByRole('button', { name: 'Keep' }).click();
    await window.getByText('Close').click();

    await window.getByText('ElectronBackend').click();
    await window.getByText('Signals in Folder Content').click();
    await expect(window.getByText('jQuery, 16.13.1')).toBeHidden();
  });

  test('displays an error if the base URL is invalid', async ({ window }) => {
    await window.getByRole('button', { name: 'Keep' }).click();
    await window.getByText('Close').click();

    await window.getByText('ElectronBackend').click();
    await window.getByRole('button').getByLabel('link to open').click();
    await expect(window.getByText('Cannot open link.')).toBeVisible();

    await window.getByText('Types').click();
    await window.getByRole('button').getByLabel('link to open').click();
    await expect(window.getByText('Cannot open link.')).toBeVisible();
  });
});
