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
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFile } from '../../../test-helpers/test-helpers';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { Attributions } from '../../../../shared/shared-types';

function setupTestState(store: EnhancedTestStore): void {
  const testAttributions: Attributions = { test_id: { packageName: 'React' } };
  store.dispatch(openPopup(PopupType.ReplaceAttributionPopup));
  store.dispatch(setSelectedAttributionId('test_id'));
  store.dispatch(loadFromFile(getParsedInputFile(undefined, testAttributions)));
}

describe('ReplaceAttributionPopup and do not change view', () => {
  test('renders a ReplaceAttributionPopup and click reset', () => {
    const { store } = renderComponentWithStore(<ReplaceAttributionPopup />);
    setupTestState(store);

    expect(screen.queryByText('Warning')).toBeTruthy();
    expect(screen.queryAllByText('React').length).toBe(2);

    fireEvent.click(screen.queryByText(ButtonTitle.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
  });
});
