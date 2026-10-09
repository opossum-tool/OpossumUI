// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { test } from '../utils';

test('shows the default window title when no file is open', async ({
  menuBar,
}) => {
  // The renderer-covered behavior of this no-file scenario lives in
  // src/Frontend/integration-tests/using-app-without-a-file.test.tsx.
  // The native window title is not observable there, so it is checked here.
  await menuBar.assert.hasTitle('OpossumUI');
});
