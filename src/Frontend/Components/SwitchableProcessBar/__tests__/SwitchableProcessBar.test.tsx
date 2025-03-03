// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { setVariable } from '../../../state/actions/variables-actions/variables-actions';
import { PROGRESS_DATA } from '../../../state/variables/use-progress-data';
import { renderComponent } from '../../../test-helpers/render';
import { ProgressBarData } from '../../../types/types';
import { SwitchableProcessBar } from '../SwitchableProcessBar';

describe('SwitchableProcessBar', () => {
  it('does not display the progress bar when no progress data available', () => {
    renderComponent(<SwitchableProcessBar />);
    expect(screen.queryByLabelText('ProgressBar')).not.toBeInTheDocument();
  });

  it('displays the progress bar when progress data available', () => {
    renderComponent(<SwitchableProcessBar />, {
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
