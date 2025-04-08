// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { PROGRESS_DATA } from '../../../state/variables/use-progress-data';
import { renderComponent } from '../../../test-helpers/render';
import { ProgressBarData } from '../../../types/types';
import { SwitchableProgressBar } from '../SwitchableProgressBar';

const PROGRESS_BAR_DATA: ProgressBarData = {
  fileCount: 6,
  filesWithHighlyCriticalExternalAttributionsCount: 1,
  filesWithMediumCriticalExternalAttributionsCount: 1,
  filesWithManualAttributionCount: 3,
  filesWithOnlyExternalAttributionCount: 1,
  filesWithOnlyPreSelectedAttributionCount: 1,
  resourcesWithMediumCriticalExternalAttributions: [],
  resourcesWithNonInheritedExternalAttributionOnly: [],
  resourcesWithHighlyCriticalExternalAttributions: [],
  classificationStatistics: {},
};

const switchableProgressBarText = text.topBar.switchableProgressBar;
const attributionProgressBarLabel =
  switchableProgressBarText.attributionProgressBar.ariaLabel;

function openSelect() {
  fireEvent.mouseDown(screen.getByRole('combobox'), {
    advanceTimers: jest.runOnlyPendingTimersAsync,
  });
}

function expectSelectToBeOpen() {
  expect(
    screen.getByText(
      switchableProgressBarText.attributionProgressBar.selectLabel,
      {
        selector: 'li',
      },
    ),
  ).toBeInTheDocument();
}

async function selectEntry(selectLabel: string) {
  await userEvent.click(screen.getByText(selectLabel), {
    advanceTimers: jest.runOnlyPendingTimersAsync,
  });
}

function getCriticalSignalsProgressBar() {
  return screen.getByLabelText(
    switchableProgressBarText.criticalSignalsBar.ariaLabel,
  );
}

function getAttributionProgressBar() {
  return screen.getByLabelText(
    switchableProgressBarText.attributionProgressBar.ariaLabel,
  );
}

describe('SwitchableProcessBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does not display the progress bar when no progress data available', () => {
    renderComponent(<SwitchableProgressBar />);
    expect(screen.queryByLabelText(/Progress bar .*/)).not.toBeInTheDocument();
  });

  it('displays the progress bar when progress data available', () => {
    renderComponent(<SwitchableProgressBar />, {
      actions: [setVariable<ProgressBarData>(PROGRESS_DATA, PROGRESS_BAR_DATA)],
    });

    expect(
      screen.getByLabelText(attributionProgressBarLabel),
    ).toBeInTheDocument();
  });

  it('switches the progress bar via the select', async () => {
    renderComponent(<SwitchableProgressBar />, {
      actions: [setVariable<ProgressBarData>(PROGRESS_DATA, PROGRESS_BAR_DATA)],
    });

    openSelect();
    expectSelectToBeOpen();
    await selectEntry(switchableProgressBarText.criticalSignalsBar.selectLabel);

    expect(getCriticalSignalsProgressBar()).toBeInTheDocument();

    openSelect();
    expectSelectToBeOpen();
    await selectEntry(
      switchableProgressBarText.attributionProgressBar.selectLabel,
    );

    expect(getAttributionProgressBar()).toBeInTheDocument();
  });

  it('offers all three possible progress bars by default', async () => {
    renderComponent(<SwitchableProgressBar />, {
      actions: [setVariable<ProgressBarData>(PROGRESS_DATA, PROGRESS_BAR_DATA)],
    });

    openSelect();
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
    renderComponent(<SwitchableProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(PROGRESS_DATA, PROGRESS_BAR_DATA),
        setUserSetting({ showClassifications: false }),
      ],
    });

    openSelect();
    expectSelectToBeOpen();

    const menuEntries = (await screen.findAllByRole('option')).map(
      (element) => element.textContent,
    );

    expect(menuEntries).toEqual(['Attributions', 'Criticalities']);
  });

  it('does not offer criticality if disabled', async () => {
    renderComponent(<SwitchableProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(PROGRESS_DATA, PROGRESS_BAR_DATA),
        setUserSetting({ showCriticality: false }),
      ],
    });

    openSelect();
    expectSelectToBeOpen();

    const menuEntries = (await screen.findAllByRole('option')).map(
      (element) => element.textContent,
    );

    expect(menuEntries).toEqual(['Attributions', 'Classifications']);
  });

  it('does not show select if only one option to select', () => {
    renderComponent(<SwitchableProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(PROGRESS_DATA, PROGRESS_BAR_DATA),
        setUserSetting({ showCriticality: false, showClassifications: false }),
      ],
    });

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
