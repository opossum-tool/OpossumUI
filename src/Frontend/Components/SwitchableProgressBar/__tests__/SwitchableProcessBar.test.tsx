// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { SwitchableProgressBar } from '../SwitchableProgressBar';

const preSelectedPackage = faker.opossum.packageInfo({
  preSelected: true,
  criticality: Criticality.High,
});
const manualPackage = faker.opossum.packageInfo();
const externalPackage = faker.opossum.packageInfo({
  criticality: Criticality.Medium,
});
const data = {
  ...getParsedInputFileEnrichedWithTestData({
    externalAttributions: faker.opossum.attributions({
      [externalPackage.id]: externalPackage,
      [preSelectedPackage.id]: preSelectedPackage,
    }),
    manualAttributions: faker.opossum.attributions({
      [manualPackage.id]: manualPackage,
    }),
    resourcesToManualAttributions: {
      '/a': [manualPackage.id],
      '/a/b/a': [preSelectedPackage.id],
      '/a/b/b': [externalPackage.id],
    },
    attributionBreakpoints: new Set(['/a/b']),
    resources: pathsToResources([
      'a/a/a',
      'a/a/b',
      'a/a/c',
      'a/b/a',
      'a/b/b',
      'a/b/c',
    ]),
  }),
  metadata: { projectId: faker.string.uuid(), fileCreationDate: '' },
};

const switchableProgressBarText = text.topBar.switchableProgressBar;
const attributionProgressBarLabel =
  switchableProgressBarText.attributionBar.ariaLabel;

async function openSelect() {
  fireEvent.mouseDown(await screen.findByRole('combobox'), {
    advanceTimers: vi.runOnlyPendingTimersAsync,
  });
}

function expectSelectToBeOpen() {
  expect(
    screen.getByText(switchableProgressBarText.attributionBar.selectLabel, {
      selector: 'li',
    }),
  ).toBeInTheDocument();
}

async function selectEntry(selectLabel: string) {
  await userEvent.click(screen.getByText(selectLabel), {
    advanceTimers: vi.runOnlyPendingTimersAsync,
  });
}

function getCriticalSignalsProgressBar() {
  return screen.getByLabelText(
    switchableProgressBarText.criticalityBar.ariaLabel,
  );
}

function getAttributionProgressBar() {
  return screen.getByLabelText(
    switchableProgressBarText.attributionBar.ariaLabel,
  );
}

describe('SwitchableProcessBar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('does not display the progress bar when no progress data available', async () => {
    await renderComponent(<SwitchableProgressBar />);
    expect(screen.queryByLabelText(/Progress bar .*/)).not.toBeInTheDocument();
  });

  it('displays the progress bar when progress data available', async () => {
    await renderComponent(<SwitchableProgressBar />, { data });

    expect(
      await screen.findByLabelText(attributionProgressBarLabel),
    ).toBeInTheDocument();
  });

  it('switches the progress bar via the select', async () => {
    await renderComponent(<SwitchableProgressBar />, { data });

    await openSelect();
    expectSelectToBeOpen();
    await selectEntry(switchableProgressBarText.criticalityBar.selectLabel);

    expect(getCriticalSignalsProgressBar()).toBeInTheDocument();

    await openSelect();
    expectSelectToBeOpen();
    await selectEntry(switchableProgressBarText.attributionBar.selectLabel);

    expect(getAttributionProgressBar()).toBeInTheDocument();
  });

  it('offers all three possible progress bars by default', async () => {
    await renderComponent(<SwitchableProgressBar />, { data });

    await openSelect();
    expectSelectToBeOpen();

    const menuEntries = (await screen.findAllByRole('option')).map(
      (element) => element.textContent,
    );

    expect(menuEntries).toEqual([
      'Attributions',
      'Criticalities',
      'Classifications',
    ]);
  });

  it('does not offer classifications if disabled', async () => {
    await renderComponent(<SwitchableProgressBar />, {
      data,
      actions: [setUserSetting({ showClassifications: false })],
    });

    await openSelect();
    expectSelectToBeOpen();

    const menuEntries = (await screen.findAllByRole('option')).map(
      (element) => element.textContent,
    );

    expect(menuEntries).toEqual(['Attributions', 'Criticalities']);
  });

  it('does not offer criticality if disabled', async () => {
    await renderComponent(<SwitchableProgressBar />, {
      data,
      actions: [setUserSetting({ showCriticality: false })],
    });

    await openSelect();
    expectSelectToBeOpen();

    const menuEntries = (await screen.findAllByRole('option')).map(
      (element) => element.textContent,
    );

    expect(menuEntries).toEqual(['Attributions', 'Classifications']);
  });

  it('does not show select if only one option to select', async () => {
    await renderComponent(<SwitchableProgressBar />, { data });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
