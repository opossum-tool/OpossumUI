// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderApp } from './helpers/render-app';
import {
  expectLinkedResourcesTreeVisibility,
  expectOpenFileButtonVisibility,
  expectViewIsActive,
  gotoReportView,
} from './helpers/ui';

describe('using the app without a file', () => {
  // The native window title (`menuBar.assert.hasTitle('OpossumUI')`) is not
  // renderer-observable; that check lives in the e2e suite
  // src/e2e-tests/__tests__/using-app-without-a-file.test.ts.
  it('provides expected functionality when no file is open', async () => {
    await renderApp();
    await expectOpenFileButtonVisibility(true);
    await expectViewIsActive('audit');
    await expectLinkedResourcesTreeVisibility(false);
    // Without a file the whole resource browser is not rendered.
    expect(screen.queryByTestId('resources-tree')).toBeNull();

    await gotoReportView();
    await expectViewIsActive('report');
  });
});
