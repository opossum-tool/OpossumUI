// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '../utils';

test.use({
  file: 'src/e2e-tests/assets/opossum_input_and_output_e2e.opossum',
});

test.describe('OpossumUI with modern file', () => {
  test('opens file and displays signals', async ({ window }) => {
    await expect(window.getByText('Frontend')).toBeVisible();
    await window.getByText('Close').click();
    await window.getByText('ElectronBackend').click();
    await expect(window.getByText('jQuery, 16.13.1')).toBeVisible();
  });

  test('hides signals in accordion', async ({ window }) => {
    await window.getByText('Close').click();
    await window.getByText('ElectronBackend').click();
    await window.getByText('Signals in Folder Content').click();
    await expect(window.getByText('jQuery, 16.13.1')).toBeHidden();
  });
});
