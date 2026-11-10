// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { test } from '../utils';

test.use({
  showStartupWhatsNew: true,
  openFromCLI: false,
});

test('shows new release notes once and reopens them from Help after a restart', async ({
  whatsNewPopup,
  relaunch,
}) => {
  await whatsNewPopup.assert.isVisible();
  await whatsNewPopup.assert.seenRevisionIsRecorded();
  const seenRevision = await whatsNewPopup.getSeenRevision();

  await whatsNewPopup.closeButton.click();
  await whatsNewPopup.assert.isHidden();

  const restarted = await relaunch();
  await restarted.whatsNewPopup.assert.seenRevisionIs(seenRevision);
  await restarted.topBar.assert.openFileButtonIsVisible();
  await restarted.whatsNewPopup.assert.isHidden();

  await restarted.menuBar.showWhatsNew();
  await restarted.whatsNewPopup.assert.isVisible();
  await restarted.whatsNewPopup.closeButton.click();
  await restarted.whatsNewPopup.assert.isHidden();
});
