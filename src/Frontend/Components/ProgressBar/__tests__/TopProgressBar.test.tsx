// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ProgressBarData } from '../../../types/types';
import { WORKER_REDUX_KEYS } from '../../../web-workers/use-signals-worker';
import { TopProgressBar } from '../TopProgressBar';

describe('TopProgressBar', () => {
  jest.useFakeTimers();

  it('renders regular progress bar', async () => {
    renderComponentWithStore(<TopProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(WORKER_REDUX_KEYS.OVERALL_PROGRESS_DATA, {
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 3,
          filesWithOnlyExternalAttributionCount: 1,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
        }),
      ],
    });

    await userEvent.hover(screen.getByLabelText('TopProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(screen.getByText(/Number of files: 6/)).toBeInTheDocument();
    expect(screen.getByText(/Files with attributions: 3/)).toBeInTheDocument();
    expect(
      screen.getByText(/Files with only pre-selected attributions: 1/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Files with only signals: 1/)).toBeInTheDocument();
  });

  it('renders in criticality view', async () => {
    renderComponentWithStore(<TopProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(WORKER_REDUX_KEYS.OVERALL_PROGRESS_DATA, {
          fileCount: 6,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 1,
          filesWithOnlyExternalAttributionCount: 3,
          filesWithOnlyPreSelectedAttributionCount: 1,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
        }),
      ],
    });

    await userEvent.click(screen.getByRole('checkbox'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });
    await userEvent.hover(screen.getByLabelText('TopProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(
      screen.getByText(
        /Number of files with signals and no attributions \(3\)/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing highly-critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing medium-critical signals: 1/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/containing only non-critical signals: 1/),
    ).toBeInTheDocument();
  });
});
