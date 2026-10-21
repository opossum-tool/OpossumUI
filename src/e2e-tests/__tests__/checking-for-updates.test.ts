// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { text } from '../../shared/text';
import { faker, test } from '../utils';

test.use({ playwrightTracing: false });
const [attributionId, attribution] = faker.opossum.rawAttribution({
  packageName: 'manual-package',
  licenseName: 'MIT',
});
const resourcePath = faker.opossum.filePath('src', 'index.js');

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({ [resourcePath]: 1 }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId]: attribution,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [resourcePath]: [attributionId],
      }),
    }),
  },
});

test('checks through the native menu and displays a dismissible error banner', async ({
  window,
  menuBar,
  topBar,
  attributionsPanel,
  attributionDetails,
  reportView,
}) => {
  await window.app.evaluate(({ net }) => {
    net.fetch = () =>
      Promise.resolve(new Response('Unavailable', { status: 503 }));
  }, {});

  const banner = window.getByRole('alert');
  const topBarLocator = window.getByLabel('top bar');
  const viewportHeight = window.viewportSize()!.height;
  await attributionsPanel.packageCard.click(attribution);
  await attributionDetails.assert.loadingIndicatorIsHidden();
  const attributionColumn = window.getByLabel('attribution column');
  const reportContent = window.getByLabel('report view');
  const views = [
    {
      content: attributionColumn,
      activate: async () => {},
      assertVisible: async () => {},
    },
    {
      content: reportContent,
      activate: () => topBar.gotoReportView(),
      assertVisible: () => reportView.assert.isVisible(),
    },
  ];

  for (const { content, activate, assertVisible } of views) {
    await activate();
    await assertVisible();
    const originalBounds = await content.boundingBox();
    expect(originalBounds).not.toBeNull();

    await menuBar.checkForUpdates();
    await expect(banner).toContainText('Update check failed:');
    await expect(async () => {
      const bannerBounds = await banner.boundingBox();
      const topBarBounds = await topBarLocator.boundingBox();
      expect(bannerBounds).not.toBeNull();
      expect(topBarBounds).not.toBeNull();
      expect(bannerBounds!.y).toBeGreaterThanOrEqual(
        topBarBounds!.y + topBarBounds!.height - 1,
      );
    }).toPass();
    await expect(async () => {
      const bannerBounds = await banner.boundingBox();
      const contentBounds = await content.boundingBox();
      expect(bannerBounds).not.toBeNull();
      expect(contentBounds).not.toBeNull();
      expect(contentBounds!.y).toBeGreaterThanOrEqual(
        bannerBounds!.y + bannerBounds!.height - 1,
      );
      expect(contentBounds!.y + contentBounds!.height).toBeLessThanOrEqual(
        viewportHeight + 1,
      );
    }).toPass();

    await banner
      .getByRole('button', { name: text.updateApp.dismissed })
      .click();
    await expect(banner).toHaveCount(0);
    await expect(async () => {
      const currentBounds = await content.boundingBox();
      expect(currentBounds).not.toBeNull();
      expect(currentBounds!.y).toBeGreaterThanOrEqual(originalBounds!.y - 1);
      expect(currentBounds!.y).toBeLessThanOrEqual(originalBounds!.y + 1);
      expect(currentBounds!.height).toBeGreaterThanOrEqual(
        originalBounds!.height - 1,
      );
      expect(currentBounds!.height).toBeLessThanOrEqual(
        originalBounds!.height + 1,
      );
    }).toPass();
  }
});
