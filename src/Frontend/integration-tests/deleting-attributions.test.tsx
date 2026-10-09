// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
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
  expectResourceVisibility,
  expectSelectedTabIs,
  expectTabVisibility,
  gotoResource,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';

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

async function expectProgressBarTooltipShowsValues(
  filesWithAttributions: number,
): Promise<void> {
  await userEvent.hover(screen.getByTestId('progress-bar'));
  await waitFor(
    () => {
      const tooltip = screen.queryByRole('tooltip');
      if (!tooltip) {
        throw new Error('Tooltip not shown');
      }
      // Matches the e2e page object: values of 0 are omitted from the
      // tooltip by the component and therefore only the visibility of
      // the tooltip itself is asserted.
      if (filesWithAttributions > 0) {
        expect(
          within(tooltip).getByText(
            `with attributions: ${filesWithAttributions}`,
            { exact: false },
          ),
        ).toBeVisible();
      }
    },
    { timeout: 10000 },
  );
}

describe('deleting attributions', () => {
  it('deletes single attributions and updates progress bar', async () => {
    const invalidationErrors: Array<string> = [];
    const consoleErrorSpy = vi.spyOn(console, 'error');
    consoleErrorSpy.mockImplementation((...args: Array<unknown>) => {
      const message = args.map((arg) => String(arg)).join(' ');
      if (message.includes('Failed to invalidate mutation queries')) {
        invalidationErrors.push(message);
      }
    });

    await renderApp({ data });

    await gotoResource(resourceName1);
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo3);
    await expectAttributionFormMatchesPackageInfo(packageInfo3);
    await expectProgressBarTooltipShowsValues(5);

    await clickAttributionColumnButton('delete');
    await clickPopupButton('confirm delete popup', 'Delete on All');
    await expectPopupHidden('confirm delete popup');
    await expectAttributionFormIsEmpty();
    await expectProgressBarTooltipShowsValues(5);

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
    await expectProgressBarTooltipShowsValues(4);

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
    await expectProgressBarTooltipShowsValues(2);

    await gotoResource(resourceName3);
    await expectAttributionFormIsEmpty();
    await expectAttributionColumnButtonVisibility('delete', false);

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionFormMatchesPackageInfo(packageInfo2);
    await expectAttributionColumnButtonVisibility('delete', true);

    await clickAttributionColumnButton('delete');
    await clickPopupButton('confirm delete popup', 'Delete on All');
    await expectPopupHidden('confirm delete popup');
    await expectProgressBarTooltipShowsValues(0);

    consoleErrorSpy.mockRestore();
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
