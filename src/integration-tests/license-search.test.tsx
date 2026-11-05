// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { faker } from '../testing/Faker';
import { renderApp } from './helpers/render-app';
import {
  addLicenseSearchFilter,
  clickFilterMenuButton,
  clickTreeFilterMenuButton,
  closeFilterMenu,
  expectLicenseFilterOption,
  expectPackageCards,
  expectReportAttributionVisibility,
  expectResourceVisibility,
  fillLicenseFilter,
  getReportView,
  gotoReportView,
} from './helpers/ui';

const entries = [
  'MIT',
  'Ä-License',
  'ä-License',
  undefined,
  'Apache 2.0',
  'Apache-2.0',
].map((licenseName, index) => ({
  resource: `license-${index}.txt`,
  licenseName,
  manual: faker.opossum.rawAttribution({
    packageName: `attribution-${index}`,
    licenseName,
    packageVersion: undefined,
  }),
  external: faker.opossum.rawAttribution({
    packageName: `signal-${index}`,
    licenseName,
    packageVersion: undefined,
  }),
}));

const data = getParsedInputFileEnrichedWithTestData({
  resources: Object.fromEntries(entries.map(({ resource }) => [resource, 1])),
  manualAttributions: deserializeAttributions(
    Object.fromEntries(entries.map(({ manual }) => manual)),
  ),
  externalAttributions: deserializeAttributions(
    Object.fromEntries(entries.map(({ external }) => external)),
  ),
  resourcesToManualAttributions: Object.fromEntries(
    entries.map(({ resource, manual }) => [`/${resource}`, [manual[0]]]),
  ),
  resourcesToExternalAttributions: Object.fromEntries(
    entries.map(({ resource, external }) => [`/${resource}`, [external[0]]]),
  ),
});

describe.each([
  'attributions-panel',
  'signals-panel',
  'report',
  'resources',
] as const)('license search in %s', (context) => {
  async function openFilter() {
    if (context === 'resources') {
      await clickTreeFilterMenuButton();
    } else {
      await clickFilterMenuButton(
        context === 'report' ? getReportView() : screen.getByTestId(context),
      );
    }
  }

  async function expectResults(matching: Array<number>) {
    const visible = entries.filter((_, index) => matching.includes(index));
    const hidden = entries.filter((_, index) => !matching.includes(index));
    if (context === 'resources') {
      await expectResourceVisibility(
        visible.map(({ resource }) => resource),
        hidden.map(({ resource }) => resource),
      );
    } else if (context === 'report') {
      await expectReportAttributionVisibility(
        visible.map(({ manual }) => manual[0]),
        hidden.map(({ manual }) => manual[0]),
      );
    } else {
      const source = context === 'signals-panel' ? 'external' : 'manual';
      await expectPackageCards(
        context,
        visible.map((entry) => entry[source][1]),
        hidden.map((entry) => entry[source][1]),
      );
    }
  }

  it.each([
    { query: 'mIt', matching: [0] },
    { query: 'ä', matching: [2] },
    { query: 'License', matching: [1, 2] },
    { query: 'Apache-', matching: [4, 5] },
    { query: 'Apache 2', matching: [4, 5] },
  ])(
    'keeps picker and returned records aligned for $query',
    async ({ query, matching }) => {
      await renderApp({
        data,
        userSettings: { panelSizes: { signalsPanelHeight: 1200 } },
      });
      if (context === 'report') {
        await gotoReportView();
      }
      await expectResults([0, 1, 2, 3, 4, 5]);
      await openFilter();
      await fillLicenseFilter('');
      const apacheLabel =
        (await screen.findByRole('option', { name: /^Apache[- ]2\.0$/ }))
          .textContent ?? '';
      await fillLicenseFilter(query);
      for (const [index, entry] of entries.entries()) {
        // Both Apache spellings share one canonical option and a stable label.
        if (index === 5) {
          continue;
        }
        if (entry.licenseName) {
          await expectLicenseFilterOption(
            index === 4 ? apacheLabel : entry.licenseName,
            matching.includes(index),
          );
        }
      }
      await addLicenseSearchFilter(query);
      await closeFilterMenu();
      await expectResults(matching);

      await openFilter();
      await fillLicenseFilter('');
      await userEvent.click(
        screen.getByRole('button', { name: 'Clear licenses' }),
      );
      await closeFilterMenu();
      await expectResults([0, 1, 2, 3, 4, 5]);
    },
  );
});
