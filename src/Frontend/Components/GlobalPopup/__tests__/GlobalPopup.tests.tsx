// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { GlobalPopup } from '../GlobalPopup';
import { PopupType } from '../../../enums/enums';
import { screen } from '@testing-library/react';

describe('The GlobalPopUp', () => {
  test('does not open by default', () => {
    renderComponentWithStore(<GlobalPopup />);

    expect(screen.queryByText('Warning')).toBeFalsy();
  });

  test('opens the NotSavedPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.NotSavedPopup));

    expect(screen.queryByText('Warning')).toBeTruthy();
  });

  test('opens the ErrorPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ErrorPopup));

    expect(screen.queryByText('Error')).toBeTruthy();
  });

  test('opens the FileSearchPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.FileSearchPopup));

    expect(screen.queryByText('Search for Files and Directories')).toBeTruthy();
  });

  test('opens the ProjectMetadataPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ProjectMetadataPopup));

    expect(screen.queryByText('Project Metadata')).toBeTruthy();
  });

  test('opens the ReplaceAttributionPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ReplaceAttributionPopup));

    expect(
      screen.queryByText('This removes the following attribution')
    ).toBeTruthy();
  });

  test('opens the ConfirmDeletionPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ConfirmDeletionPopup));

    expect(
      screen.queryByText(
        'Do you really want to delete this attribution for the current file?'
      )
    ).toBeTruthy();
  });

  test('opens the ConfirmDeletionGloballyPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ConfirmDeletionGloballyPopup));

    expect(
      screen.queryByText(
        'Do you really want to delete this attribution for all files?'
      )
    ).toBeTruthy();
  });
});
