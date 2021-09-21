// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import {
  openErrorPopup,
  openFileSearchPopup,
  openNotSavedPopup,
  openProjectMetadataPopup,
} from '../../../state/actions/view-actions/view-actions';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { GlobalPopup } from '../GlobalPopup';

describe('The GlobalPopUp', () => {
  test('does not open by default', () => {
    const { queryByText } = renderComponentWithStore(<GlobalPopup />);

    expect(queryByText('Warning')).toBeFalsy();
  });

  test('opens the NotSavedPopup', () => {
    const { queryByText, store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openNotSavedPopup());

    expect(queryByText('Warning')).toBeTruthy();
  });

  test('opens the ErrorPopup', () => {
    const { queryByText, store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openErrorPopup());

    expect(queryByText('Error')).toBeTruthy();
  });

  test('opens the FileSearchPopup', () => {
    const { queryByText, store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openFileSearchPopup());

    expect(queryByText('Search for Files and Directories')).toBeTruthy();
  });

  test('opens the ProjectMetadataPopup', () => {
    const { queryByText, store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openProjectMetadataPopup());

    expect(queryByText('Project Metadata')).toBeTruthy();
  });
});
