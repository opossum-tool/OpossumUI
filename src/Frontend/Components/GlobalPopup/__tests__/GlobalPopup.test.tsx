// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { importFileFormats } from '../../../../ElectronBackend/main/menu/fileMenu';
import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import {
  closePopup,
  openImportDialog,
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
    expect(
      global.window.electronAPI.setFrontendDialogState,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({ anyDialogOpen: true }),
    );
  });

  it('opens the NotSavedPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.NotSavedPopup)],
    });

    expect(
      screen.getByText(text.unsavedChangesPopup.title),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        global.window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );
  });

  it('opens the ProjectMetadataPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ProjectMetadataPopup)],
    });

    expect(await screen.findByText('Project Metadata')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        global.window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );
  });

  it('opens the ProjectStatisticsPopup', async () => {
    await renderComponent(<GlobalPopup />, {
      data: getParsedInputFileEnrichedWithTestData({}),
      actions: [openPopup(PopupType.ProjectStatisticsPopup)],
    });

    expect(await screen.findByText('Project Statistics')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        global.window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );
  });

  it('opens the SplitDialog', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openSplitDialog()],
    });

    expect(
      screen.getByRole('dialog', { name: text.splitDialog.title }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        global.window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );
  });

  it('retains import form state while covered by another popup', async () => {
    vi.mocked(window.electronAPI.selectFile).mockResolvedValue('/chosen.json');
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openImportDialog(importFileFormats[0])],
    });

    fireEvent.click(screen.getByTestId('import-input-file-path-input'));
    await waitFor(() =>
      expect(
        screen.getByTestId('import-input-file-path-input'),
      ).toHaveTextContent('/chosen.json'),
    );

    await act(() => store.dispatch(openPopup(PopupType.ProjectMetadataPopup)));
    const metadataEntry = store.getState().viewState.popupInfo.at(-1);
    expect(screen.getByText('Project Metadata')).toBeInTheDocument();
    expect(
      screen.getByTestId('import-input-file-path-input'),
    ).toHaveTextContent('/chosen.json');

    await act(() => store.dispatch(closePopup(metadataEntry!.id)));
    expect(
      screen.getByTestId('import-input-file-path-input'),
    ).toHaveTextContent('/chosen.json');
  });
});
