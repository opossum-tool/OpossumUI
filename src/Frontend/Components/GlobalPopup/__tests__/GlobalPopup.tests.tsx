// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import {
  openPopup,
  openPopupWithTargetAttributionId,
} from '../../../state/actions/view-actions/view-actions';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { GlobalPopup } from '../GlobalPopup';
import { PopupType } from '../../../enums/enums';
import { screen } from '@testing-library/react';
import { Attributions } from '../../../../shared/shared-types';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  setMultiSelectMode,
  setMultiSelectSelectedAttributionIds,
} from '../../../state/actions/resource-actions/attribution-view-simple-actions';

describe('The GlobalPopUp', () => {
  test('does not open by default', () => {
    renderComponentWithStore(<GlobalPopup />);

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
  });

  test('opens the NotSavedPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.NotSavedPopup));

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  test('opens the ErrorPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.UnableToSavePopup));

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  test('opens the FileSearchPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.FileSearchPopup));

    expect(
      screen.getByText('Search for Files and Directories')
    ).toBeInTheDocument();
  });

  test('opens the ProjectMetadataPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ProjectMetadataPopup));

    expect(screen.getByText('Project Metadata')).toBeInTheDocument();
  });

  test('opens the ReplaceAttributionPopup', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'name 1' },
    };
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testAttributions,
        })
      )
    );

    renderComponentWithStore(<GlobalPopup />, {
      store: testStore,
    });
    testStore.dispatch(
      openPopupWithTargetAttributionId(
        PopupType.ReplaceAttributionPopup,
        'uuid1'
      )
    );

    expect(
      screen.getByText('This removes the following attribution')
    ).toBeInTheDocument();
  });

  test('opens the ConfirmDeletionPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(
      openPopupWithTargetAttributionId(PopupType.ConfirmDeletionPopup, 'test')
    );

    expect(
      screen.getByText(
        'Do you really want to delete this attribution for the current file?'
      )
    ).toBeInTheDocument();
  });

  test('opens the ConfirmDeletionGloballyPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(
      openPopupWithTargetAttributionId(
        PopupType.ConfirmDeletionGloballyPopup,
        'test'
      )
    );

    expect(
      screen.getByText(
        'Do you really want to delete this attribution for all files?'
      )
    ).toBeInTheDocument();
  });

  test('opens the ConfirmMultiSelectDeletionPopup', () => {
    const { store } = renderComponentWithStore(<GlobalPopup />);
    store.dispatch(openPopup(PopupType.ConfirmMultiSelectDeletionPopup));
    store.dispatch(setMultiSelectMode(true));
    store.dispatch(setMultiSelectSelectedAttributionIds(['uuid_1', 'uuid_2']));

    expect(
      screen.getByText(
        'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.'
      )
    ).toBeInTheDocument();
  });
});
