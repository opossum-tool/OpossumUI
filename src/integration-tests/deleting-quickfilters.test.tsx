// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import {
  RESOURCE_TREE_FILTERS,
  type ResourceTreeFilters,
} from '../Frontend/state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import type { SavedAttributionQuickfilter } from '../shared/shared-types';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp, type RenderAppResult } from '../testing/render-app';
import {
  clickFilterMenuButton,
  clickFilterMenuItem,
  clickTreeFilterMenuButton,
  closeFilterMenu,
  expectResourceItemsNotShown,
  expectResourceItemsShown,
  selectFilterLicenseName,
  SIGNALS_PANEL,
} from '../testing/ui';

const [mitResourceName, apacheResourceName] = faker.opossum.resourceNames({
  count: 2,
});
const [mitSignalId, mitPackageInfo] = faker.opossum.rawAttribution({
  licenseName: 'MIT',
});
const [apacheSignalId, apachePackageInfo] = faker.opossum.rawAttribution({
  licenseName: 'Apache-2.0',
});

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [mitResourceName]: 1,
    [apacheResourceName]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [mitSignalId]: mitPackageInfo,
    [apacheSignalId]: apachePackageInfo,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(mitResourceName)]: [mitSignalId],
    [faker.opossum.filePath(apacheResourceName)]: [apacheSignalId],
  }),
});

// License-only quickfilter saved on the signals panel; the resource tree
// offers it as a converted resource quickfilter.
const QUICKFILTER: SavedAttributionQuickfilter = {
  id: 'signal-license-quickfilter',
  name: 'MIT license',
  scope: 'signal',
  filters: {
    filters: [],
    search: '',
    valueFilters: { license: [{ id: 'mit', label: 'MIT' }] },
  },
};

async function renderFixture(): Promise<RenderAppResult> {
  return renderApp({
    data,
    userSettings: { savedQuickfilters: [QUICKFILTER] },
  });
}

async function applyQuickfilterInResourceTree(): Promise<void> {
  await clickTreeFilterMenuButton();
  await clickFilterMenuItem(text.quickfilters.title);
  await userEvent.click(
    await screen.findByRole('button', {
      name: text.quickfilters.apply(QUICKFILTER.name),
    }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole('button', {
        name: text.quickfilters.apply(QUICKFILTER.name),
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
}

function expectResourceTreeMenuEntrySelected(selected: boolean): void {
  // The accessible name follows the visible label, which reflects the
  // selection.
  const entry = screen.getByRole('menuitem', {
    name: new RegExp(
      `^(${text.quickfilters.title}|${text.quickfilters.titleSelected})$`,
    ),
  });
  if (selected) {
    expect(
      within(entry).getByText(text.quickfilters.titleSelected),
    ).toBeInTheDocument();
  } else {
    expect(
      within(entry).queryByText(text.quickfilters.titleSelected),
    ).toBeNull();
  }
}

function readResourceTreeFilters(store: RenderAppResult['store']) {
  return store.getState().variablesState[RESOURCE_TREE_FILTERS] as
    ResourceTreeFilters | undefined;
}

describe('deleting quickfilters across panels', () => {
  it('deselects a quickfilter in the resource tree when its license is removed with the regular filter control', async () => {
    await renderFixture();
    await applyQuickfilterInResourceTree();
    expectResourceTreeMenuEntrySelected(true);
    await closeFilterMenu();
    await expectResourceItemsShown([mitResourceName]);
    await expectResourceItemsNotShown([apacheResourceName]);

    // Remove the license the quickfilter contributed via the regular tree
    // filter control; the quickfilter must deselect itself.
    await clickTreeFilterMenuButton();
    expectResourceTreeMenuEntrySelected(true);
    await selectFilterLicenseName('MIT');
    await closeFilterMenu();

    await clickTreeFilterMenuButton();
    expectResourceTreeMenuEntrySelected(false);
    await closeFilterMenu();
    await expectResourceItemsShown([mitResourceName, apacheResourceName]);
  });

  it('deselects a quickfilter in the resource tree when it is deleted from the signals panel', async () => {
    const { store } = await renderFixture();
    await applyQuickfilterInResourceTree();
    expectResourceTreeMenuEntrySelected(true);
    await closeFilterMenu();

    // Delete the quickfilter from the signals panel while it is applied in
    // the resource tree.
    await clickFilterMenuButton(screen.getByTestId(SIGNALS_PANEL));
    await clickFilterMenuItem(text.quickfilters.title);
    await userEvent.click(
      screen.getByRole('button', { name: text.quickfilters.edit }),
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: text.quickfilters.delete(QUICKFILTER.name),
      }),
    );
    await closeFilterMenu();

    // The deselection propagates to the resource tree filters, while the
    // license the quickfilter had contributed stays applied as a manual
    // filter.
    expect(
      readResourceTreeFilters(store)?.activeQuickfilterIds,
    ).toBeUndefined();
    expect(
      readResourceTreeFilters(store)?.selectedLicenses.map(({ id }) => id),
    ).toEqual(['mit']);

    await clickTreeFilterMenuButton();
    expectResourceTreeMenuEntrySelected(false);
    await closeFilterMenu();
    await expectResourceItemsShown([mitResourceName]);
    await expectResourceItemsNotShown([apacheResourceName]);
  });
});
