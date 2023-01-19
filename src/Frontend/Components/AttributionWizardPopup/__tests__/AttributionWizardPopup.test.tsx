// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { act, fireEvent, screen } from '@testing-library/react';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { ButtonText, PopupType } from '../../../enums/enums';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  setExternalData,
  setManualData,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';

const selectedResourceId = '/samplepath/';
const testExternalAttributions: Attributions = {
  uuid_0: {
    packageName: 'react',
    packageNamespace: 'npm',
  },
};
const testManualAttributions: Attributions = {
  uuid_0: {
    packageName: 'react',
    packageNamespace: 'npm',
  },
};
const testExternalResourcesToAttributions: ResourcesToAttributions = {
  '/samplepath/subfolder': ['uuid_0'],
};
const testManualResourcesToAttributions: ResourcesToAttributions = {
  selectedResourceId: ['uuid_0'],
};

describe('AttributionWizardPopup', () => {
  it('renders with header, resource path, and buttons', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
    );
    renderComponentWithStore(<GlobalPopup />, { store: testStore });
    act(() => {
      testStore.dispatch(openPopup(PopupType.AttributionWizardPopup, 'uuid_0'));
    });

    expect(screen.getByText('Attribution Wizard')).toBeInTheDocument();
    expect(screen.getByText(selectedResourceId)).toBeInTheDocument();
    expect(screen.getByText(ButtonText.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonText.Next)).toBeInTheDocument();
  });

  it('closes when clicking "cancel"', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
    );
    renderComponentWithStore(<GlobalPopup />, { store: testStore });
    act(() => {
      testStore.dispatch(openPopup(PopupType.AttributionWizardPopup, 'uuid_0'));
    });

    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.AttributionWizardPopup
    );

    fireEvent.click(screen.getByText(ButtonText.Cancel));
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('renders breadcrumbs', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
    );
    renderComponentWithStore(<GlobalPopup />, { store: testStore });
    act(() => {
      testStore.dispatch(openPopup(PopupType.AttributionWizardPopup, 'uuid_0'));
    });

    expect(screen.getByText('package')).toBeInTheDocument();
    expect(screen.getByText('version')).toBeInTheDocument();
  });
});

describe('AttributionWizardPopup navigation', () => {
  const namespaceListTitle = 'Package namespace';
  const nameListTitle = 'Package name';
  const versionListTitle = 'Package version';

  it('allows navigation via "next" and "back" buttons', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
    );
    renderComponentWithStore(<GlobalPopup />, { store: testStore });
    act(() => {
      testStore.dispatch(openPopup(PopupType.AttributionWizardPopup, 'uuid_0'));
    });

    expect(screen.getByText(namespaceListTitle)).toBeInTheDocument();
    expect(screen.getByText(nameListTitle)).toBeInTheDocument();
    expect(screen.queryByText(versionListTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('react'));
    fireEvent.click(screen.getByText('npm'));
    fireEvent.click(screen.getByText(ButtonText.Next));

    expect(screen.queryByText(namespaceListTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(nameListTitle)).not.toBeInTheDocument();
    expect(screen.getByText(versionListTitle)).toBeInTheDocument();

    fireEvent.click(screen.getByText(ButtonText.Back));

    expect(screen.getByText(namespaceListTitle)).toBeInTheDocument();
    expect(screen.getByText(nameListTitle)).toBeInTheDocument();
    expect(screen.queryByText(versionListTitle)).not.toBeInTheDocument();
  });

  it('allows navigation via breadcrumbs (back only, so far)', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testExternalResourcesToAttributions
      )
    );
    testStore.dispatch(
      setManualData(testManualAttributions, testManualResourcesToAttributions)
    );
    renderComponentWithStore(<GlobalPopup />, { store: testStore });
    act(() => {
      testStore.dispatch(openPopup(PopupType.AttributionWizardPopup, 'uuid_0'));
    });

    expect(screen.getByText(namespaceListTitle)).toBeInTheDocument();
    expect(screen.getByText(nameListTitle)).toBeInTheDocument();
    expect(screen.queryByText(versionListTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('react'));
    fireEvent.click(screen.getByText('npm'));
    fireEvent.click(screen.getByText(ButtonText.Next));

    expect(screen.queryByText(namespaceListTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(nameListTitle)).not.toBeInTheDocument();
    expect(screen.getByText(versionListTitle)).toBeInTheDocument();

    fireEvent.click(screen.getByText('package'));

    expect(screen.getByText(namespaceListTitle)).toBeInTheDocument();
    expect(screen.getByText(nameListTitle)).toBeInTheDocument();
    expect(screen.queryByText(versionListTitle)).not.toBeInTheDocument();
  });
});
