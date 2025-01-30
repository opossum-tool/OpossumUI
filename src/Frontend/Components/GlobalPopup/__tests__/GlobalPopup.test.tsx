// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { importFileFormats } from '../../../../ElectronBackend/main/menu';
import { FilePathValidity } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { renderComponent } from '../../../test-helpers/render';
import { GlobalPopup } from '../GlobalPopup';

describe('The GlobalPopUp', () => {
  it('does not open by default', () => {
    renderComponent(<GlobalPopup />);

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
  });

  it('opens the NotSavedPopup', () => {
    renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.NotSavedPopup)],
    });

    expect(
      screen.getByText(text.unsavedChangesPopup.title),
    ).toBeInTheDocument();
  });

  it('opens the ProjectMetadataPopup', () => {
    renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ProjectMetadataPopup)],
    });

    expect(screen.getByText('Project Metadata')).toBeInTheDocument();
  });

  it('opens the ProjectStatisticsPopup', () => {
    renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ProjectStatisticsPopup)],
    });

    expect(screen.getByText('Project Statistics')).toBeInTheDocument();
  });

  it('opens the UpdateAppPopup', () => {
    renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.UpdateAppPopup)],
    });

    expect(screen.getByText(text.updateAppPopup.title)).toBeInTheDocument();
  });

  it('opens the ImportDialog', () => {
    jest
      .spyOn(window.electronAPI, 'importFileValidatePaths')
      .mockResolvedValue([FilePathValidity.VALID, FilePathValidity.VALID]);

    renderComponent(<GlobalPopup />, {
      actions: [
        openPopup(PopupType.ImportDialog, undefined, importFileFormats[0]),
      ],
    });

    expect(
      screen.getByText(`Import ${importFileFormats[0].name}`),
    ).toBeInTheDocument();
  });
});
