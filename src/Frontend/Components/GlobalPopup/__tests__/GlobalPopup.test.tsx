// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  expectPopupVisibility,
  expectSplitDialogVisibility,
  expectUnsavedChangesPopupVisibility,
} from '../../../../testing/ui';
import { PopupType } from '../../../enums/enums';
import {
  openPopup,
  openSplitDialog,
} from '../../../state/actions/view-actions/view-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../GlobalPopup';

describe('The GlobalPopUp', () => {
  it('does not open by default', async () => {
    await renderComponent(<GlobalPopup />);

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
    await expectUnsavedChangesPopupVisibility(false);
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).not.toHaveBeenCalledWith(true);
  });

  it('opens the NotSavedPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.NotSavedPopup)],
    });

    await expectUnsavedChangesPopupVisibility(true);
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });

  it('opens the ProjectMetadataPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ProjectMetadataPopup)],
    });

    await expectPopupVisibility('project metadata', true);
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });

  it('opens the ProjectStatisticsPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      data: getParsedInputFileEnrichedWithTestData({}),
      actions: [openPopup(PopupType.ProjectStatisticsPopup)],
    });

    await expectPopupVisibility('project statistics', true);
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });

  it('opens the SplitDialog', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openSplitDialog()],
    });

    await expectSplitDialogVisibility(true);
    expect(
      global.window.electronAPI.setFrontendPopupOpen,
    ).toHaveBeenLastCalledWith(true);
  });
});
