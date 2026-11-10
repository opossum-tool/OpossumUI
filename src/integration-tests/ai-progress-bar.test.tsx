// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  getPendingAttributionNavigation,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../Frontend/state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickPopupButton,
  clickProgressBar,
  expectFormFieldValues,
  expectPackageCards,
  expectPopupHidden,
  expectSelectedTabIs,
  expectTabVisibility,
  fillFormField,
  fillPanelSearch,
  saveChangesInAttributionColumn,
  selectProgressBar,
  selectTab,
} from '../testing/ui';

const aiText = text.topBar.switchableProgressBar.aiBar;

async function renderAiProject(selectAiBar = true) {
  await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: { 'file.ts': 1, 'other.ts': 1 },
      manualAttributions: {
        ordinary: { id: 'ordinary', criticality: 0, packageName: 'Ordinary' },
        a: {
          id: 'a',
          criticality: 0,
          packageName: 'Pending A',
          aiAttributions: { deferredFields: {} },
        },
        b: {
          id: 'b',
          criticality: 0,
          packageName: 'Pending B',
          aiAttributions: { deferredFields: {}, humanModified: false },
        },
        c: {
          id: 'c',
          criticality: 0,
          packageName: 'Modified deferred',
          aiAttributions: { deferredFields: {}, humanModified: true },
        },
        d: {
          id: 'd',
          criticality: 0,
          packageName: 'AI output',
          aiAttributions: {},
        },
        e: {
          id: 'e',
          criticality: 0,
          packageName: 'Modified AI output',
          aiAttributions: { humanModified: true },
        },
      },
      resourcesToManualAttributions: {
        '/file.ts': ['ordinary', 'a', 'b', 'c', 'd', 'e'],
        '/other.ts': ['a'],
      },
    }),
  });
  await screen.findByLabelText(
    text.topBar.switchableProgressBar.selectAriaLabel,
  );
  if (selectAiBar) {
    await selectProgressBar('AI');
  }
}

test('checks AI availability on opening a file but only loads counts after selecting AI review', async () => {
  await renderAiProject(false);
  const api = vi.mocked(window.electronAPI.api);
  await screen.findByLabelText(
    text.topBar.switchableProgressBar.attributionBar.ariaLabel,
  );
  expect(
    api.mock.calls.some(([command]) => command === 'hasAiAttributions'),
  ).toBe(true);
  expect(
    api.mock.calls.some(([command]) => command === 'getAiProgressBarData'),
  ).toBe(false);
  await selectProgressBar('AI');
  await expectAiTooltip({ deferredUnmodified: 2 });
  expect(
    api.mock.calls.some(([command]) => command === 'getAiProgressBarData'),
  ).toBe(true);
});

async function expectAiTooltip(
  counts: Partial<
    Record<
      | 'nonDeferredUnmodified'
      | 'nonDeferredModified'
      | 'deferredModified'
      | 'deferredUnmodified',
      number
    >
  >,
) {
  await userEvent.hover(screen.getByLabelText(aiText.ariaLabel));
  const tooltip = await screen.findByRole('tooltip', {
    name: /AI attributions/,
  });
  const table = within(tooltip).getByRole('table', { name: aiText.intro });
  expect(
    within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent),
  ).toEqual([aiText.status, aiText.unmodified, aiText.humanModified]);
  await waitFor(() => {
    for (const [key, count] of Object.entries(counts)) {
      const rowLabel = key.startsWith('nonDeferred')
        ? aiText.nonDeferred
        : aiText.deferred;
      const row = within(table).getByRole('row', {
        name: new RegExp(`^${rowLabel}`),
      });
      const cells = within(row).getAllByRole('cell');
      expect(cells[key.endsWith('Unmodified') ? 0 : 1]).toHaveTextContent(
        String(count),
      );
    }
    if (counts.deferredUnmodified !== undefined) {
      expect(tooltip).toHaveTextContent(
        `${aiText.needsManualInput}: ${counts.deferredUnmodified}`,
      );
      expect(tooltip).toHaveTextContent(
        counts.deferredUnmodified ? aiText.navigationHint : aiText.completed,
      );
    }
  });
  await userEvent.unhover(screen.getByLabelText(aiText.ariaLabel));
}

test('shows four states, selects exact pending attributions, and updates after an edit', async () => {
  await renderAiProject();
  await expectAiTooltip({
    nonDeferredUnmodified: 1,
    nonDeferredModified: 1,
    deferredModified: 1,
    deferredUnmodified: 2,
  });
  await fillPanelSearch('attributions-panel-header', 'Ordinary');
  await clickProgressBar();
  await expectFormFieldValues({ name: 'Pending A' });
  await clickProgressBar();
  await expectFormFieldValues({ name: 'Pending B' });
  fillFormField('comment', 'Human input');
  await saveChangesInAttributionColumn();
  await expectAiTooltip({ deferredModified: 2, deferredUnmodified: 1 });
  await clickProgressBar();
  await expectFormFieldValues({ name: 'Pending A' });
  await clickProgressBar();
  await expectFormFieldValues({ name: 'Pending A' });
});

test('reselecting the current pending AI attribution reveals it after switching tabs', async () => {
  const { store } = await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: faker.opossum.resources({
        folder: { 'file.ts': 1, 'other.ts': 1 },
      }),
      manualAttributions: {
        other: { id: 'other', criticality: 0, packageName: 'Other' },
        pending: {
          id: 'pending',
          criticality: 0,
          packageName: 'Pending',
          aiAttributions: { deferredFields: {} },
        },
      },
      resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath('folder', 'file.ts')]: ['pending'],
        [faker.opossum.filePath('folder', 'other.ts')]: ['other'],
      }),
    }),
  });
  await screen.findByLabelText(
    text.topBar.switchableProgressBar.selectAriaLabel,
  );
  await selectProgressBar('AI');
  await clickProgressBar();
  await expectFormFieldValues({ name: 'Pending' });
  await waitFor(() => {
    expect(getPendingAttributionNavigation(store.getState())).toBeNull();
  });
  const selectedResourceId = getSelectedResourceId(store.getState());
  const selectedAttributionId = getSelectedAttributionId(store.getState());

  await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
  await expectTabVisibility(ATTRIBUTIONS_PANEL, ['resource', 'unrelated']);
  await selectTab(ATTRIBUTIONS_PANEL, 'unrelated');
  await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'unrelated');
  await expectPackageCards(ATTRIBUTIONS_PANEL, [
    { id: 'other', criticality: 0, packageName: 'Other' },
  ]);
  expect(getSelectedAttributionId(store.getState())).toBe(
    selectedAttributionId,
  );

  await clickProgressBar();
  await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
  await expectPackageCards(ATTRIBUTIONS_PANEL, [
    {
      id: 'pending',
      criticality: 0,
      packageName: 'Pending',
    },
  ]);
  expect(getSelectedResourceId(store.getState())).toBe(selectedResourceId);
  expect(getSelectedAttributionId(store.getState())).toBe(
    selectedAttributionId,
  );
  await waitFor(() => {
    expect(getPendingAttributionNavigation(store.getState())).toBeNull();
  });
});

test('preserves unsaved edits on cancel and navigates on discard', async () => {
  await renderAiProject();
  await clickProgressBar();
  await expectFormFieldValues({ name: 'Pending A' });
  fillFormField('comment', 'Unsaved input');
  await clickProgressBar();
  await clickPopupButton('unsaved changes popup', text.buttons.cancel);
  await expectPopupHidden('unsaved changes popup');
  await expectFormFieldValues({
    name: 'Pending A',
    comment: 'Unsaved input',
  });
  await clickProgressBar();
  await clickPopupButton(
    'unsaved changes popup',
    text.unsavedChangesPopup.discard,
  );
  await expectFormFieldValues({ name: 'Pending B', comment: '' });
});

test('offers a completed AI review bar when no AI attribution is deferred', async () => {
  await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: { 'file.ts': 1 },
      manualAttributions: {
        ai: {
          id: 'ai',
          criticality: 0,
          packageName: 'AI output',
          aiAttributions: {},
        },
      },
      resourcesToManualAttributions: { '/file.ts': ['ai'] },
    }),
  });
  await screen.findByLabelText(
    text.topBar.switchableProgressBar.selectAriaLabel,
  );
  await selectProgressBar('AI');
  await expectAiTooltip({
    nonDeferredUnmodified: 1,
    nonDeferredModified: 0,
    deferredModified: 0,
    deferredUnmodified: 0,
  });
  await clickProgressBar();
  expect(
    within(screen.getByLabelText('path bar')).queryByText('file.ts'),
  ).not.toBeInTheDocument();
});

test('does not offer AI review without AI attributions', async () => {
  await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: { 'file.ts': 1 },
    }),
    userSettings: { showCriticality: true },
  });
  await userEvent.click(
    await screen.findByLabelText(
      text.topBar.switchableProgressBar.selectAriaLabel,
    ),
  );
  expect(
    screen.queryByRole('option', { name: aiText.selectLabel }),
  ).not.toBeInTheDocument();
});

test('reveals a pending attribution beyond the first page when navigating from Report', async () => {
  const ordinary = Object.fromEntries(
    Array.from({ length: 205 }, (_, index) => [
      `ordinary-${index}`,
      {
        id: `ordinary-${index}`,
        criticality: 0,
        packageName: `Package ${index}`,
      },
    ]),
  );
  await renderApp({
    data: getParsedInputFileEnrichedWithTestData({
      resources: { 'file.ts': 1 },
      manualAttributions: {
        ...ordinary,
        target: {
          id: 'target',
          criticality: 0,
          packageName: 'ZZZ pending',
          aiAttributions: { deferredFields: {} },
        },
      },
      resourcesToManualAttributions: {
        '/file.ts': [...Object.keys(ordinary), 'target'],
      },
    }),
  });
  await screen.findByLabelText(
    text.topBar.switchableProgressBar.selectAriaLabel,
  );
  await selectProgressBar('AI');
  await userEvent.click(
    screen.getByRole('button', { name: text.topBar.report }),
  );
  await clickProgressBar();
  await expectFormFieldValues({ name: 'ZZZ pending' });
  expect(
    screen.getByRole('button', { name: text.topBar.audit }),
  ).toHaveAttribute('aria-pressed', 'true');
});
