// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { test } from '../utils';

test('enables user to navigate through views', async ({ menuBar, topBar }) => {
  await menuBar.assert.showsExpectedTitle();
  await topBar.assert.modeButtonsAreVisible();
  await topBar.assert.auditViewIsActive();

  await topBar.gotoAttributionView();
  await topBar.assert.attributionViewIsActive();

  await topBar.gotoReportView();
  await topBar.assert.reportViewIsActive();
});
