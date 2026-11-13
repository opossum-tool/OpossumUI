// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { classificationStepDescription } from '../../Frontend/Components/ProgressBar/ProgressBar.util';
import { text } from '../../shared/text';
import { escapeRegExp, SETTLED_TIMEOUT } from './common';

const TOP_BAR_LABEL = 'top bar';

function getTopBar(): HTMLElement {
  return screen.getByLabelText(TOP_BAR_LABEL);
}

export async function clickTopBarOpenFileButton(): Promise<void> {
  await userEvent.click(
    within(getTopBar()).getByRole('button', { name: 'open file' }),
  );
}

export async function clickTopBarViewButton(
  view: 'audit' | 'report',
): Promise<void> {
  // Like clickTopBarOpenFileButton, but without asserting the resulting view:
  // used when the view switch is gated by an unsaved-changes popup.
  await userEvent.click(
    within(getTopBar()).getByRole('button', {
      name: view === 'audit' ? text.topBar.audit : text.topBar.report,
    }),
  );
}

export async function gotoReportView(): Promise<void> {
  await userEvent.click(
    within(getTopBar()).getByRole('button', { name: text.topBar.report }),
  );
  await expectViewIsActive('report');
}

export async function expectViewIsActive(
  view: 'audit' | 'report',
): Promise<void> {
  await waitFor(() => {
    const viewActiveButtonName =
      view === 'audit' ? text.topBar.audit : text.topBar.report;
    const viewInactiveButtonName =
      view === 'audit' ? text.topBar.report : text.topBar.audit;
    expect(
      within(getTopBar()).getByRole('button', { name: viewActiveButtonName }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(getTopBar()).getByRole('button', { name: viewActiveButtonName }),
    ).toBeDisabled();
    expect(
      within(getTopBar()).getByRole('button', {
        name: viewInactiveButtonName,
      }),
    ).toHaveAttribute('aria-pressed', 'false');
  }, SETTLED_TIMEOUT);
}

export async function expectOpenFileButtonVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const button = within(getTopBar()).queryByRole('button', {
      name: 'open file',
    });
    if (button === null) {
      expect(visible).toBe(false);
    } else {
      expect(button).toBeVisible();
    }
  }, SETTLED_TIMEOUT);
}

export async function clickProgressBar(): Promise<void> {
  const progressBar = await waitFor(
    () => screen.getByTestId('progress-bar'),
    SETTLED_TIMEOUT,
  );
  await userEvent.click(progressBar);
}

type ProgressBarMode =
  'Attributions' | 'Criticalities' | 'Classifications' | 'AI';

const PROGRESS_BAR_MODE_TEXT: Record<
  ProgressBarMode,
  { selectLabel: string; ariaLabel: string }
> = {
  AI: text.topBar.switchableProgressBar.aiBar,
  Attributions: text.topBar.switchableProgressBar.attributionBar,
  Criticalities: text.topBar.switchableProgressBar.criticalityBar,
  Classifications: text.topBar.switchableProgressBar.classificationBar,
};

const PROGRESS_BAR_MODE_INTROS: Record<ProgressBarMode, string> = {
  Attributions: text.topBar.switchableProgressBar.attributionBar.intro,
  Criticalities: text.topBar.switchableProgressBar.criticalityBar.intro,
  Classifications: text.topBar.switchableProgressBar.classificationBar.intro,
};

async function expectProgressBarModeIs(mode: ProgressBarMode): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId('progress-bar')).toHaveAttribute(
      'aria-label',
      PROGRESS_BAR_MODE_TEXT[mode].ariaLabel,
    );
  }, SETTLED_TIMEOUT);
}

export async function selectProgressBar(mode: ProgressBarMode): Promise<void> {
  await userEvent.click(
    screen.getByLabelText(text.topBar.switchableProgressBar.selectAriaLabel),
  );
  await userEvent.click(
    await screen.findByRole('option', {
      name: PROGRESS_BAR_MODE_TEXT[mode].selectLabel,
    }),
  );
  await expectProgressBarModeIs(mode);
}

export interface ProgressBarTooltipValues {
  filesWithAttributions?: number;
  filesWithOnlyPreSelectedAttributions?: number;
  filesWithOnlySignals?: number;
  filesWithNeitherAttributionsOrSignals?: number;
  filesWithHighlyCriticalSignals?: number;
  filesWithMediumCriticalSignals?: number;
  filesWithOnlyNonCriticalSignals?: number;
  classifications?: Array<{ classification: string; count: number }>;
}

export async function hoverProgressBar(): Promise<void> {
  const progressBar = await waitFor(
    () => screen.getByTestId('progress-bar'),
    SETTLED_TIMEOUT,
  );
  fireEvent.mouseOver(progressBar, { clientX: 10, clientY: 10 });
}

export async function expectProgressBarTooltipShowsValues(
  values: ProgressBarTooltipValues,
  mode: ProgressBarMode = 'Attributions',
): Promise<void> {
  // Pure assertion: hover the progress bar first via hoverProgressBar(). The
  // component renders one "…label: count" line per nonzero segment and omits
  // zero segments entirely, so zero or unprovided segments must render no
  // line. The full set of lines has to match the provided values: both a
  // wrongly counted and an unexpected extra line fail the assertion.
  const expectedValues: Array<[number, string]> = [];
  if (values.filesWithAttributions) {
    expectedValues.push([
      values.filesWithAttributions,
      text.topBar.switchableProgressBar.attributionBar
        .filesWithManualAttribution,
    ]);
  }
  if (values.filesWithOnlyPreSelectedAttributions) {
    expectedValues.push([
      values.filesWithOnlyPreSelectedAttributions,
      text.topBar.switchableProgressBar.attributionBar
        .filesWithOnlyPreSelectedAttribution,
    ]);
  }
  if (values.filesWithOnlySignals) {
    expectedValues.push([
      values.filesWithOnlySignals,
      text.topBar.switchableProgressBar.attributionBar
        .filesWithOnlyExternalAttribution,
    ]);
  }
  if (values.filesWithNeitherAttributionsOrSignals) {
    expectedValues.push([
      values.filesWithNeitherAttributionsOrSignals,
      text.topBar.switchableProgressBar.attributionBar
        .filesWithNeitherAttributionsOrSignals,
    ]);
  }
  if (values.filesWithHighlyCriticalSignals) {
    expectedValues.push([
      values.filesWithHighlyCriticalSignals,
      text.topBar.switchableProgressBar.criticalityBar
        .filesWithHighlyCriticalSignals,
    ]);
  }
  if (values.filesWithMediumCriticalSignals) {
    expectedValues.push([
      values.filesWithMediumCriticalSignals,
      text.topBar.switchableProgressBar.criticalityBar
        .filesWithMediumCriticalSignals,
    ]);
  }
  if (values.filesWithOnlyNonCriticalSignals) {
    expectedValues.push([
      values.filesWithOnlyNonCriticalSignals,
      text.topBar.switchableProgressBar.criticalityBar
        .filesWithOnlyNonCriticalSignals,
    ]);
  }
  for (const { classification, count } of values.classifications ?? []) {
    if (count) {
      expectedValues.push([
        count,
        classificationStepDescription(classification),
      ]);
    }
  }
  const expectedLines = expectedValues
    .map(([count, label]) => `…${label}: ${count}`)
    .sort();
  await waitFor(() => {
    const tooltips = screen.getAllByRole('tooltip');
    const tooltip = tooltips.find((candidate) => {
      return (
        within(candidate).queryByText(
          new RegExp(escapeRegExp(PROGRESS_BAR_MODE_INTROS[mode])),
        ) !== null
      );
    });
    expect(tooltip).toBeTruthy();
    // Count lines are the only tooltip lines starting with the ellipsis that
    // prefixes them; the intro line ends with one and does not match.
    const actualLines = within(tooltip as HTMLElement)
      .queryAllByText(/^…/)
      .map((line) => line.textContent ?? '')
      .sort();
    expect(actualLines).toEqual(expectedLines);
  }, SETTLED_TIMEOUT);
}
