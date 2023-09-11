// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { LocatorPopup } from '../LocatorPopup';
import { getLocatePopupSelectedCriticality } from '../../../state/selectors/locate-popup-selectors';
import { clickOnButton } from '../../../test-helpers/general-test-helpers';
import { setLocatePopupSelectedCriticality } from '../../../state/actions/resource-actions/locate-popup-actions';
import { SelectedCriticality } from '../../../../shared/shared-types';

describe('Locator popup ', () => {
  jest.useFakeTimers();

  it('renders', () => {
    renderComponentWithStore(<LocatorPopup />);
    expect(
      screen.getByText('Locate Signals', { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Criticality')).toBeInTheDocument();
    expect(screen.getByText('Any')).toBeInTheDocument();
  });

  it('selects criticality values using the dropdown', () => {
    const testStore = createTestAppStore();
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    fireEvent.mouseDown(screen.getByText('Any').childNodes[0] as Element);

    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();

    fireEvent.click(screen.getByText('High').parentNode as Element);

    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      SelectedCriticality.Any,
    );

    clickOnButton(screen, 'Apply');

    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      SelectedCriticality.High,
    );
  });

  it('resets criticality using the Clear button', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupSelectedCriticality(SelectedCriticality.Medium),
    );
    renderComponentWithStore(<LocatorPopup />, { store: testStore });

    expect(screen.getByText('Medium')).toBeInTheDocument();

    clickOnButton(screen, 'Clear');

    expect(screen.getByText('Any')).toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();

    expect(getLocatePopupSelectedCriticality(testStore.getState())).toBe(
      SelectedCriticality.Any,
    );
  });
});
