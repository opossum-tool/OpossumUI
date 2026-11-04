// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator } from '@playwright/test';

export async function expectNoVerticalScroll(locator: Locator): Promise<void> {
  await expect
    .poll(() =>
      locator.evaluate(
        (element) => element.scrollHeight - element.clientHeight,
      ),
    )
    .toBeLessThanOrEqual(1);
}
