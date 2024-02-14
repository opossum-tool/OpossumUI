// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderComponent } from '../../../test-helpers/render';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  jest.useFakeTimers();

  it('renders regular progress bar', async () => {
    renderComponent(
      <ProgressBar
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 3,
          filesWithOnlyExternalAttributionCount: 1,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
        }}
      />,
    );

    await userEvent.hover(screen.getByLabelText('ProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(screen.getByText(/Number of resources/)).toBeInTheDocument();
    expect(screen.getByText(/with attributions: 3/)).toBeInTheDocument();
    expect(
      screen.getByText(/with only pre-selected attributions: 1/),
    ).toBeInTheDocument();
    expect(screen.getByText(/with only signals: 1/)).toBeInTheDocument();
  });

  it('renders in criticality view', async () => {
    renderComponent(
      <ProgressBar
        progressBarData={{
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 1,
          filesWithOnlyExternalAttributionCount: 3,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
        }}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });
    await userEvent.hover(screen.getByLabelText('ProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(
      screen.getByText(/Number of resources with signals and no attributions/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing highly critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing only non-critical signals: 1/),
    ).toBeInTheDocument();
  });
});
