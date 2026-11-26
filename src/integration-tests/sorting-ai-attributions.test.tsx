// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { View } from '../Frontend/enums/enums';
import { setVariable } from '../Frontend/state/actions/variables-actions/variables-actions';
import { navigateToView } from '../Frontend/state/actions/view-actions/view-actions';
import { getSelectedAttributionId } from '../Frontend/state/selectors/resource-selectors';
import {
  initialAttributionFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
} from '../Frontend/state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality } from '../shared/shared-types';
import { text } from '../shared/text';
import { renderApp } from '../testing/render-app';
import {
  expectFormFieldValues,
  fillFormField,
  fillPanelSearch,
} from '../testing/ui';

async function selectSort(label: string) {
  await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: label }));
  await userEvent.keyboard('{Escape}');
}

async function expectOrder(names: Array<string>) {
  await waitFor(() => {
    const cards = within(
      screen.getByTestId('attributions-panel'),
    ).getAllByLabelText(/^package card /);
    expect(cards.map((card) => card.getAttribute('aria-label'))).toEqual(
      names.map((name) => `package card ${name}`),
    );
  });
}

const sortingData = getParsedInputFileEnrichedWithTestData({
  resources: { first: 1, second: 1, third: 1 },
  config: { classifications: { 1: 'Low', 2: 'Medium', 3: 'High' } },
  manualAttributions: {
    alpha: {
      id: 'alpha',
      packageName: 'Alpha',
      criticality: Criticality.None,
      classification: 3,
      aiAttributes: { deferredFields: {} },
    },
    bravo: {
      id: 'bravo',
      packageName: 'Bravo',
      criticality: Criticality.Medium,
      classification: 1,
      aiAttributes: {},
    },
    charlie: {
      id: 'charlie',
      packageName: 'Charlie',
      criticality: Criticality.High,
      classification: 2,
      aiAttributes: { deferredFields: {} },
    },
  },
  resourcesToManualAttributions: {
    '/first': ['alpha', 'bravo', 'charlie'],
    '/second': ['bravo', 'charlie'],
    '/third': ['bravo'],
  },
});

async function renderSortingView() {
  return renderApp({
    data: sortingData,
    actions: [
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        sorting: 'occurrence',
      }),
      navigateToView(View.AiReview),
    ],
    userSettings: { showCriticality: true, showClassifications: true },
  });
}

test('sorts AI attributions by each available mode', async () => {
  await renderSortingView();
  await expectOrder(['Alpha', 'Bravo', 'Charlie']);
  const header = screen.getByTestId('ai-review-attributions-header');
  expect(
    within(header).getByRole('button', { name: 'sort button' }),
  ).toBeVisible();
  const sortCases = [
    [text.sortings.occurrence, ['Bravo', 'Charlie', 'Alpha']],
    [text.sortings.criticality, ['Charlie', 'Bravo', 'Alpha']],
    [text.sortings.classification, ['Alpha', 'Charlie', 'Bravo']],
    [text.sortings.name, ['Alpha', 'Bravo', 'Charlie']],
  ] as const;
  for (const [sortLabel, names] of sortCases) {
    await selectSort(sortLabel);
    await expectOrder([...names]);
  }
});

test('keeps AI sorting independent of Audit and retains filters, selection, and drafts', async () => {
  const { store } = await renderSortingView();
  await expectFormFieldValues({ name: 'Alpha' });
  fillFormField('comment', 'Unsaved AI review');

  await userEvent.click(screen.getByRole('button', { name: 'Deferred 2' }));
  await selectSort(text.sortings.criticality);
  await expectOrder(['Charlie', 'Alpha']);
  await fillPanelSearch('ai-review-attributions-header', 'Alpha');
  await expectOrder(['Alpha']);

  expect(getSelectedAttributionId(store.getState())).toBe('alpha');
  expect(screen.getByDisplayValue('Unsaved AI review')).toBeVisible();
  expect(
    screen.queryByLabelText('unsaved changes popup'),
  ).not.toBeInTheDocument();
  expect(
    store.getState().variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT],
  ).toMatchObject({ sorting: 'occurrence' });
});
