// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { View } from '../../../enums/enums';
import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { initialResourceState } from '../../../state/reducers/resource-reducer';
import {
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../state/selectors/view-selector';
import { PROGRESS_DATA } from '../../../state/variables/use-progress-data';
import { renderComponent } from '../../../test-helpers/render';
import { ProgressBarData } from '../../../types/types';
import { TopBar } from '../TopBar';

describe('TopBar', () => {
  it('renders an open file icon', () => {
    const { store } = renderComponent(<TopBar />);

    fireEvent.click(screen.getByLabelText('open file'));

    expect(store.getState().resourceState).toMatchObject(initialResourceState);
    expect(window.electronAPI.openFile).toHaveBeenCalledTimes(1);
  });

  it('switches between views', () => {
    const { store } = renderComponent(<TopBar />);

    fireEvent.click(screen.getByText(View.Audit));
    expect(isAuditViewSelected(store.getState())).toBe(true);
    expect(isReportViewSelected(store.getState())).toBe(false);

    fireEvent.click(screen.getByText(View.Report));
    expect(isAuditViewSelected(store.getState())).toBe(false);
    expect(isReportViewSelected(store.getState())).toBe(true);
  });

  it('does not display the progress bar when no progress data available', () => {
    renderComponent(<TopBar />);
    expect(screen.queryByLabelText('ProgressBar')).not.toBeInTheDocument();
  });

  it('displays the progress bar when progress data available', () => {
    renderComponent(<TopBar />, {
      actions: [
        setVariable<ProgressBarData>(PROGRESS_DATA, {
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
    expect(screen.getByLabelText('ProgressBar')).toBeInTheDocument();
  });
});
