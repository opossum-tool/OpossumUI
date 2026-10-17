// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it, vi } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickAttributionColumnButton,
  clickPackageCard,
  clickPackageCardCheckbox,
  clickPanelButton,
  clickPopupButton,
  expectAttributionColumnButtonVisibility,
  expectAttributionFormIsEmpty,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCardCheckbox,
  expectPackageCards,
  expectPopupHasText,
  expectPopupHidden,
  expectProgressBarTooltipShowsValues,
  expectResourceVisibility,
  expectSelectedTabIs,
  expectTabVisibility,
  gotoResource,
} from './helpers/ui';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
    [resourceName3]: 1,
    [resourceName4]: 1,
    [resourceName5]: 1,
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [attributionId1, attributionId3],
    [faker.opossum.filePath(resourceName2)]: [attributionId1],
    [faker.opossum.filePath(resourceName3)]: [attributionId1],
    [faker.opossum.filePath(resourceName4)]: [attributionId2, attributionId3],
    [faker.opossum.filePath(resourceName5)]: [attributionId2],
  }),
});

describe('deleting attributions', () => {
  it('deletes single attributions and updates progress bar', async () => {
    const invalidationErrors: Array<string> = [];
    const originalConsoleError = console.error;
    const consoleErrorSpy = vi.spyOn(console, 'error');
    consoleErrorSpy.mockImplementation((...args: Array<unknown>) => {
      // Keep logging all errors so diagnostics are not swallowed by the spy,
      // while collecting the backend invalidation failures under test.
      originalConsoleError(...args);
      const message = args.map((arg) => String(arg)).join(' ');
      if (message.includes('Failed to invalidate mutation queries')) {
        invalidationErrors.push(message);
      }
    });

    try {
      await renderApp({ data });

      await gotoResource(resourceName1);
      await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo3);
      await expectAttributionFormMatchesPackageInfo(packageInfo3);
      await expectProgressBarTooltipShowsValues({ filesWithAttributions: 5 });

      await clickAttributionColumnButton('delete');
      await clickPopupButton('confirm delete popup', 'Delete on All');
      await expectPopupHidden('confirm delete popup');
      await expectAttributionFormIsEmpty();
      await expectProgressBarTooltipShowsValues({ filesWithAttributions: 5 });

      await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
      await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
      await expectTabVisibility(ATTRIBUTIONS_PANEL, ['unrelated']);
      await expectAttributionFormMatchesPackageInfo(packageInfo1);
      await expectResourceVisibility(
        [resourceName1, resourceName2, resourceName3],
        [],
        'linked-resources-tree',
      );

      await clickAttributionColumnButton('delete');
      await clickPopupButton('confirm delete popup', 'Delete only on Selected');
      await expectPopupHidden('confirm delete popup');
      await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'unrelated');
      await expectTabVisibility(ATTRIBUTIONS_PANEL, [], ['resource']);
      await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo1]);
      await expectAttributionFormIsEmpty();
      await expectProgressBarTooltipShowsValues({ filesWithAttributions: 4 });

      await gotoResource(resourceName2);
      await expectAttributionFormMatchesPackageInfo(packageInfo1);
      await expectResourceVisibility(
        [resourceName2, resourceName3],
        [resourceName1],
        'linked-resources-tree',
      );

      await clickAttributionColumnButton('delete');
      await clickPopupButton('confirm delete popup', 'Delete on All');
      await expectPopupHidden('confirm delete popup');
      await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'unrelated');
      await expectTabVisibility(ATTRIBUTIONS_PANEL, [], ['resource']);
      await expectPackageCards(ATTRIBUTIONS_PANEL, [], [packageInfo1]);
      await expectProgressBarTooltipShowsValues({ filesWithAttributions: 2 });

      await gotoResource(resourceName3);
      await expectAttributionFormIsEmpty();
      await expectAttributionColumnButtonVisibility('delete', false);

      await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
      await expectAttributionFormMatchesPackageInfo(packageInfo2);
      await expectAttributionColumnButtonVisibility('delete', true);

      await clickAttributionColumnButton('delete');
      await clickPopupButton('confirm delete popup', 'Delete on All');
      await expectPopupHidden('confirm delete popup');
      await expectProgressBarTooltipShowsValues({ filesWithAttributions: 0 });
    } finally {
      consoleErrorSpy.mockRestore();
    }
    expect(invalidationErrors).toEqual([]);
  });

  it('deletes multiple attributions at once', async () => {
    await renderApp({ data });
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1, false);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2, false);

    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1);
    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1, true);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2, true);

    await clickPanelButton(ATTRIBUTIONS_PANEL, 'Delete');
    await expectPopupHasText('confirm delete popup', '2 attributions');

    await clickPopupButton('confirm delete popup', 'Delete on All');
    await expectPopupHidden('confirm delete popup');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [],
      [packageInfo1, packageInfo2],
    );
    await expectAttributionFormIsEmpty();
  });
});
