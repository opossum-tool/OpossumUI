// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { pathsToResources } from '../testing/global-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickAttributionColumnButton,
  clickPackageCard,
  clickPackageCardCheckbox,
  clickPanelButton,
  clickSelectAllCheckbox,
  fillFormField,
  gotoResource,
} from './helpers/ui';

const [firstId, first] = faker.opossum.rawAttribution({
  packageName: 'first',
  packageVersion: undefined,
  preSelected: true,
});
const [secondId, second] = faker.opossum.rawAttribution({
  packageName: 'second',
  packageVersion: undefined,
  preSelected: true,
});
const data = getParsedInputFileEnrichedWithTestData({
  resources: pathsToResources(['/branch/file', '/outside', '/readonly']),
  manualAttributions: deserializeAttributions({
    [firstId]: first,
    [secondId]: second,
  }),
  resourcesToManualAttributions: {
    '/branch/file': [firstId, secondId],
    '/outside': [firstId],
    '/readonly': [firstId],
  },
  readonlyRules: [{ path: '/readonly', readonly: true }],
});

async function expectGlobalCounts(popupLabel: string) {
  const popup = await screen.findByLabelText(popupLabel);
  const firstCard = await within(popup).findByLabelText('package card first');
  const secondCard = await within(popup).findByLabelText('package card second');
  expect(await within(firstCard).findByText('2')).toBeVisible();
  expect(await within(secondCard).findByText('1')).toBeVisible();
  expect(within(popup).getByText(/(?:from|on) 2\s+resources:/)).toBeVisible();
  await userEvent.hover(within(firstCard).getByText('2'));
  expect(await screen.findByRole('tooltip')).toHaveTextContent(
    '2 editable linked resources',
  );
}

test('shows global editable counts for explicit selections while preserving panel counts', async () => {
  await renderApp({ data });
  await gotoResource('branch');
  const panel = screen.getByTestId(ATTRIBUTIONS_PANEL);
  const card = await within(panel).findByLabelText('package card first');
  expect(within(card).getByText('1')).toBeVisible();
  await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, first);
  await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, second);
  await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.delete);
  await expectGlobalCounts('confirm delete popup');
});

test('shows global editable counts in query-wide confirmation previews', async () => {
  await renderApp({ data });
  await gotoResource('branch');
  await clickSelectAllCheckbox(ATTRIBUTIONS_PANEL);
  await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.confirm);
  await expectGlobalCounts('confirm save popup');
});

test('preserves fresh counts when saving an edited attribution draft', async () => {
  await renderApp({ data });
  await gotoResource('branch');
  await clickPackageCard(ATTRIBUTIONS_PANEL, first);
  fillFormField('comment', 'Updated comment');
  await clickAttributionColumnButton('save');
  const popup = await screen.findByLabelText('confirm save popup');
  const card = await within(popup).findByLabelText('package card first');
  expect(await within(card).findByText('2')).toBeVisible();
  expect(within(card).queryByText('1')).not.toBeInTheDocument();
});
