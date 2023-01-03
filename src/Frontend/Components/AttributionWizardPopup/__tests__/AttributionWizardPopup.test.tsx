// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { AttributionWizardPopup } from '../AttributionWizardPopup';
import { fireEvent, screen } from '@testing-library/react';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { ButtonText, PopupType } from '../../../enums/enums';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { openPopup } from '../../../state/actions/view-actions/view-actions';

describe('Attribution Wizard Popup', () => {
  it('renders with header, resource path, and buttons', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('/thirdParty'));

    renderComponentWithStore(<AttributionWizardPopup />, { store: testStore });

    expect(screen.getByText('Attribution Wizard')).toBeInTheDocument();
    expect(screen.getByText('/thirdParty')).toBeInTheDocument();
    expect(screen.getByText(ButtonText.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonText.Next)).toBeInTheDocument();
  });

  it('closes when clicking "cancel"', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('/thirdParty'));

    renderComponentWithStore(<AttributionWizardPopup />, { store: testStore });
    testStore.dispatch(openPopup(PopupType.AttributionWizardPopup, 'uuid_1'));
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.AttributionWizardPopup
    );

    fireEvent.click(screen.getByText(ButtonText.Cancel));
    expect(getOpenPopup(testStore.getState())).toBe(null);
  });

  it('renders breadcrumbs in first wizard step', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('/thirdParty'));

    renderComponentWithStore(<AttributionWizardPopup />, { store: testStore });

    expect(screen.getByText('package')).toBeInTheDocument();
    expect(screen.getByText('version')).toBeInTheDocument();
  });
  // TODO: More logic required to test for navigation as it requires item selection of dispatched data
});
