// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { ButtonTitle, PopupType } from '../../../enums/enums';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import {
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';

import { ReplaceAttributionPopup } from '../ReplaceAttributionPopup';
import { openPopup } from '../../../state/actions/view-actions/view-actions';

function setupTestState(store: EnhancedTestStore): void {
  store.dispatch(openPopup(PopupType.ReplaceAttributionPopup));
}

describe('ReplaceAttributionPopup and do not change view', () => {
  test('renders a ReplaceAttributionPopup and click reset', () => {
    const { store } = renderComponentWithStore(<ReplaceAttributionPopup />);
    setupTestState(store);

    expect(screen.queryByText('Warning')).toBeTruthy();

    fireEvent.click(screen.queryByText(ButtonTitle.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
  });
});
