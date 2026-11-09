// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ElectronApplication, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { test } from '../utils';
import { getOpenPathCalls, stubOpenPath } from '../utils/shell';

async function getOpenedNoticeDocumentPath(
  app: ElectronApplication,
  fileName: string,
): Promise<string> {
  const expectedPathSuffix = path.join('notices', fileName);
  let openedPath: string | undefined;
  await expect
    .poll(async () => {
      openedPath = (await getOpenPathCalls(app)).find((candidatePath) =>
        candidatePath.endsWith(expectedPathSuffix),
      );
      return openedPath ?? null;
    })
    .not.toBeNull();
  if (!openedPath) {
    throw new Error(`Expected shell.openPath to be called for ${fileName}`);
  }
  return openedPath;
}

function assertNoticeDocumentContainsNoticeContent(
  openedPath: string,
  expectedContent: string,
): void {
  expect(fs.existsSync(openedPath), `Expected ${openedPath} to exist`).toBe(
    true,
  );
  const content = fs.readFileSync(openedPath, 'utf-8');
  expect(content).toContain('<!doctype html');
  expect(content).toContain(expectedContent);
}

test('opens the OpossumUI notices document from the about menu', async ({
  window,
  menuBar,
}) => {
  await stubOpenPath(window.app);

  await menuBar.openOpossumUiNotices();

  const openedPath = await getOpenedNoticeDocumentPath(
    window.app,
    'notices.html',
  );
  assertNoticeDocumentContainsNoticeContent(openedPath, 'OPOSSUM UI PRODUCT');
});

test('opens the Chromium notices document from the about menu', async ({
  window,
  menuBar,
}) => {
  await stubOpenPath(window.app);

  await menuBar.openChromiumNotices();

  const openedPath = await getOpenedNoticeDocumentPath(
    window.app,
    'LICENSES.chromium.html',
  );
  assertNoticeDocumentContainsNoticeContent(
    openedPath,
    'Chromium software is made available',
  );
});
