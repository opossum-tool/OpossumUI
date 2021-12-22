// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import { ConfirmMultiSelectDeletionPopup } from '../ConfirmMultiSelectDeletionPopup';
import {
  setMultiSelectMode,
  setMultiSelectSelectedAttributionIds,
} from '../../../state/actions/resource-actions/attribution-view-simple-actions';

describe('The ConfirmMultiSelectDeletionPopup', () => {
  test('renders', () => {
    const expectedContent =
      'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.';
    const expectedHeader = 'Confirm Deletion';

    const { store } = renderComponentWithStore(
      <ConfirmMultiSelectDeletionPopup />
    );
    store.dispatch(setMultiSelectMode(true));
    store.dispatch(setMultiSelectSelectedAttributionIds(['uuid_1', 'uuid_2']));

    expect(screen.getByText(expectedContent)).toBeTruthy();
    expect(screen.getByText(expectedHeader)).toBeTruthy();
  });
});
