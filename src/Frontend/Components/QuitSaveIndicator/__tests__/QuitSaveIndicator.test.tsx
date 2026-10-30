// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { setIsSavingBeforeQuit } from '../../../state/actions/view-actions/view-actions';
import { renderComponent } from '../../../test-helpers/render';
import { QuitSaveIndicator } from '../QuitSaveIndicator';

describe('QuitSaveIndicator', () => {
  it('is not rendered by default', async () => {
    await renderComponent(<QuitSaveIndicator />);

    expect(
      screen.queryByRole('progressbar', {
        name: text.quitSaveIndicator.saving,
      }),
    ).not.toBeInTheDocument();
  });

  it('shows an indeterminate progress line while saving before quit', async () => {
    await renderComponent(<QuitSaveIndicator />, {
      actions: [setIsSavingBeforeQuit(true)],
    });

    expect(
      screen.getByRole('progressbar', { name: text.quitSaveIndicator.saving }),
    ).toBeInTheDocument();
  });
});
