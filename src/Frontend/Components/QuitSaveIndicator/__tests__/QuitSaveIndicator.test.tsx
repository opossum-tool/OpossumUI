// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { setIsSavingBeforeQuit } from '../../../state/actions/view-actions/view-actions';
import { renderComponent } from '../../../test-helpers/render';
import { QuitSaveIndicator } from '../QuitSaveIndicator';

describe('QuitSaveIndicator', () => {
  it('is not shown by default', async () => {
    await renderComponent(<QuitSaveIndicator />);

    expect(
      screen.queryByRole('dialog', { name: text.quitSaveIndicator.saving }),
    ).not.toBeInTheDocument();
  });

  it('shows a blocking popup while saving before quit', async () => {
    await renderComponent(<QuitSaveIndicator />, {
      actions: [setIsSavingBeforeQuit(true)],
    });

    const popup = screen.getByRole('dialog', {
      name: text.quitSaveIndicator.saving,
    });
    expect(popup).toBeInTheDocument();
    expect(
      within(popup).getByText(text.quitSaveIndicator.saving),
    ).toBeVisible();
  });
});
