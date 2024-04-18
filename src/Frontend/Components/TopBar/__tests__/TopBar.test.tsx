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
import { ProgressBarWithButtonsData } from '../../../types/types';
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
        setVariable<ProgressBarWithButtonsData>(PROGRESS_DATA, {
          count: {
            files: 6,
            filesWithHighlyCriticalExternalAttributions: 1,
            filesWithMediumCriticalExternalAttributions: 1,
            filesWithManualAttribution: 3,
            filesWithOnlyExternalAttribution: 1,
            filesWithOnlyPreSelectedAttribution: 1,
          },
          resources: {
            withMediumCriticalExternalAttributions: [],
            withNonInheritedExternalAttributionOnly: [],
            withHighlyCriticalExternalAttributions: [],
          },
        }),
      ],
    });
    expect(screen.getByLabelText('ProgressBar')).toBeInTheDocument();
  });
});
