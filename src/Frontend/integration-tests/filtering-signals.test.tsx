// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { compact } from 'lodash-es';
import { expect } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import type { RawPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp, type RenderAppResult } from './helpers/render-app';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  followUp: 'FOLLOW_UP',
  wasPreferred: true,
  preSelected: true,
  packageVersion: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  preSelected: true,
  packageVersion: undefined,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  firstParty: true,
  preSelected: true,
  packageVersion: undefined,
});

function cardLabel(packageInfo: RawPackageInfo): string {
  return packageInfo.firstParty
    ? `package card ${text.packageLists.firstParty}`
    : `package card ${compact([
        packageInfo.packageName,
        packageInfo.packageVersion,
      ]).join(', ')}`;
}

async function expectCardVisibility(
  visible: Array<RawPackageInfo>,
  hidden: Array<RawPackageInfo>,
): Promise<void> {
  for (const packageInfo of visible) {
    const label = cardLabel(packageInfo);
    await waitFor(
      () => {
        expect(screen.getByLabelText(label)).toBeVisible();
      },
      { timeout: 10000 },
    );
  }
  for (const packageInfo of hidden) {
    await waitFor(
      () => {
        expect(screen.queryByLabelText(cardLabel(packageInfo))).toBeNull();
      },
      { timeout: 10000 },
    );
  }
}

const findMenuItem = (name: string): RegExp =>
  new RegExp(`^${escapeString(name)}( \\(\\d+\\))?$`);

function escapeString(value: string): string {
  return value.replace(/[.*+?^${}()|\\[\]]/g, '\\$&');
}

const valueFilterNames = {
  firstParty: text.filters.firstParty,
  previouslyPreferred: text.filters.previouslyPreferred,
} satisfies Record<string, string>;

async function applyValueFilter(
  filter: keyof typeof valueFilterNames,
): Promise<void> {
  await userEvent.click(
    within(screen.getByTestId('signals-panel')).getByRole('button', {
      name: 'filter button',
    }),
  );
  const item = screen.getByRole('menuitem', {
    name: findMenuItem(valueFilterNames[filter]),
  });
  await userEvent.click(item);
  await userEvent.keyboard('{Escape}');
  await waitFor(
    () => {
      expect(screen.queryByRole('menu')).toBeNull();
    },
    { timeout: 10000 },
  );
}

async function renderFixture(): Promise<RenderAppResult> {
  return renderApp({
    userSettings: {
      panelSizes: { signalsPanelHeight: 1200 },
    },
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
        [attributionId3]: packageInfo3,
      }),
      resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.folderPath(resourceName1, resourceName2)]: [
          attributionId3,
        ],
      }),
    }),
  });
}

describe('filtering signals', () => {
  it('filters signals', async () => {
    await renderFixture();
    await expectCardVisibility([packageInfo1, packageInfo2, packageInfo3], []);

    await applyValueFilter('previouslyPreferred');
    await expectCardVisibility([packageInfo1], [packageInfo2, packageInfo3]);

    await applyValueFilter('firstParty');
    await expectCardVisibility([], [packageInfo1, packageInfo2, packageInfo3]);
    await applyValueFilter('previouslyPreferred');
    await expectCardVisibility([packageInfo3], [packageInfo1, packageInfo2]);

    await applyValueFilter('firstParty');
    await expectCardVisibility([packageInfo1, packageInfo2, packageInfo3], []);
  });

  it('filters signals by license name', async () => {
    await renderFixture();
    await expectCardVisibility([packageInfo1, packageInfo2, packageInfo3], []);

    await userEvent.click(
      within(screen.getByTestId('signals-panel')).getByRole('button', {
        name: 'filter button',
      }),
    );
    const filterMenu = await screen.findByRole('menu');
    await userEvent.type(
      within(filterMenu).getByLabelText('license names'),
      packageInfo1.licenseName!,
    );
    await userEvent.click(
      await screen.findByRole('option', { name: packageInfo1.licenseName }),
    );
    await userEvent.keyboard('{Escape}');

    await expectCardVisibility([packageInfo1], [packageInfo2, packageInfo3]);
  });

  it('only displays signals matching search term', async () => {
    const { sendToChannel } = await renderFixture();
    await expectCardVisibility([packageInfo1, packageInfo2, packageInfo3], []);

    const signalsPanelHeader = screen.getByTestId('signals-panel-header');
    const searchField = within(signalsPanelHeader).getByRole('searchbox');
    await userEvent.type(searchField, packageInfo1.packageName!);
    await expectCardVisibility([packageInfo1], [packageInfo2, packageInfo3]);

    await userEvent.click(
      within(signalsPanelHeader).getByLabelText('clear search'),
    );
    await expectCardVisibility([packageInfo1, packageInfo2, packageInfo3], []);

    // The native app menu accelerator (Ctrl/Cmd+F) sends this channel to
    // focus the signals panel search field. The signal is selected first,
    // as in the original e2e flow.
    await userEvent.click(screen.getByLabelText(cardLabel(packageInfo1)));
    sendToChannel(AllowedFrontendChannels.SearchSignals);
    const searchbox = within(
      screen.getByTestId('signals-panel-header'),
    ).getByRole('searchbox');
    await waitFor(() => {
      expect(searchbox).toHaveFocus();
    });
    await userEvent.type(searchbox, packageInfo1.packageName!);
    await expectCardVisibility([packageInfo1], [packageInfo2, packageInfo3]);
  });
});
