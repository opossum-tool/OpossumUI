// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../GlobalPopup';

describe('The GlobalPopUp', () => {
  it('does not open by default', async () => {
    await renderComponent(<GlobalPopup />);

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).not.toHaveBeenCalledWith(true);
  });

  it('opens the NotSavedPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.NotSavedPopup)],
    });

    expect(
      screen.getByText(text.unsavedChangesPopup.title),
    ).toBeInTheDocument();
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });

  it('opens the ProjectMetadataPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ProjectMetadataPopup)],
    });

    expect(screen.getByText('Project Metadata')).toBeInTheDocument();
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });

  it('opens the ProjectStatisticsPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ProjectStatisticsPopup)],
    });

    expect(screen.getByText('Project Statistics')).toBeInTheDocument();
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });

  it('opens the UpdateAppPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.UpdateAppPopup)],
    });

    expect(screen.getByText(text.updateAppPopup.title)).toBeInTheDocument();
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });
});
