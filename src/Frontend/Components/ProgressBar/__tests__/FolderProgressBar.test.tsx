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
import { FolderProgressBar } from '../FolderProgressBar';

describe('FolderProgressBar', () => {
  jest.useFakeTimers();

  it('renders correctly when folder has no attributions', async () => {
    renderComponentWithStore(<FolderProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(WORKER_REDUX_KEYS.FOLDER_PROGRESS_DATA, {
          fileCount: 2,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 1,
          filesWithOnlyExternalAttributionCount: 1,
          filesWithOnlyPreSelectedAttributionCount: 0,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
        }),
      ],
    });

    await userEvent.hover(screen.getByLabelText('FolderProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(screen.getByText(/Number of files: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Files with attributions: 1/)).toBeInTheDocument();
    expect(
      screen.getByText(/Files with only pre-selected attributions: 0/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Files with only signals: 1/)).toBeInTheDocument();
  });

  it('renders correctly if folder has an attribution', async () => {
    renderComponentWithStore(<FolderProgressBar />, {
      actions: [
        setVariable<ProgressBarData>(WORKER_REDUX_KEYS.FOLDER_PROGRESS_DATA, {
          fileCount: 2,
          filesWithHighlyCriticalExternalAttributionsCount: 1,
          filesWithMediumCriticalExternalAttributionsCount: 1,
          filesWithManualAttributionCount: 2,
          filesWithOnlyExternalAttributionCount: 0,
          filesWithOnlyPreSelectedAttributionCount: 0,
          resourcesWithMediumCriticalExternalAttributions: [],
          resourcesWithNonInheritedExternalAttributionOnly: [],
          resourcesWithHighlyCriticalExternalAttributions: [],
        }),
      ],
    });

    await userEvent.hover(screen.getByLabelText('FolderProgressBar'), {
      advanceTimers: jest.runOnlyPendingTimersAsync,
    });

    expect(screen.getByText(/Number of files: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Files with attributions: 2/)).toBeInTheDocument();
    expect(
      screen.getByText(/Files with only pre-selected attributions: 0/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Files with only signals: 0/)).toBeInTheDocument();
  });
});
