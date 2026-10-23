// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator } from '@playwright/test';

export async function scrollToBottomUntilVisible(
  scroller: Locator,
  target: Locator,
): Promise<void> {
  await expect(async () => {
    await scroller.evaluate((scroller) => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'instant' });
    });
    await expect(target).toBeInViewport({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
}
