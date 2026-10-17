// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const source = { name: 'sorting-test-source', documentConfidence: 0 };
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
  packageVersion: undefined,
  classification: 0,
  source,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
  packageVersion: undefined,
  classification: 1,
  source,
});

function cardOrder(): Array<string | null> {
  return screen
    .getAllByLabelText(/^package card /)
    .map((element) => element.getAttribute('aria-label'));
}

describe('sorting signals', () => {
  it('sorts signals by classification', async () => {
    await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        resources: faker.opossum.resources({
          [resourceName1]: {
            [resourceName2]: { [resourceName3]: 1 },
          },
          [resourceName4]: 1,
        }),
        externalAttributions: deserializeAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]:
            [attributionId1],
          [faker.opossum.filePath(resourceName4)]: [attributionId2],
        }),
      }),
    });

    // The app selects the root resource '/' initially, so both signals are shown.
    await waitFor(() => {
      expect(cardOrder()).toEqual(['package card a', 'package card b']);
    });

    const signalsPanel = screen.getByTestId('signals-panel');
    await userEvent.click(
      within(signalsPanel).getByRole('button', { name: 'sort button' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.sortings.classification }),
    );
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(cardOrder()).toEqual(['package card b', 'package card a']);
    });
  });
});
