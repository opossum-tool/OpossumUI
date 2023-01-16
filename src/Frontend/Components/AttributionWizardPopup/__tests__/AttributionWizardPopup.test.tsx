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
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { setExternalData } from '../../../state/actions/resource-actions/all-views-simple-actions';

describe('AttributionWizardPopup', () => {
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
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('renders breadcrumbs', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('/thirdParty'));

    renderComponentWithStore(<AttributionWizardPopup />, { store: testStore });

    expect(screen.getByText('package')).toBeInTheDocument();
    expect(screen.getByText('version')).toBeInTheDocument();
  });
});

describe('AttributionWizardPoup navigation', () => {
  const namespaceListTitle = 'Package namespace';
  const nameListTitle = 'Package name';
  const versionListTitle = 'Package version';

  it('allows navigation via "next" and "back" buttons', () => {
    const testStore = createTestAppStore();
    const selectedResourceId = '/samplepath/';

    const testAttributions: Attributions = {
      uuid_0: {
        packageName: 'boost',
        packageNamespace: 'pkg:npm',
      },
      uuid_1: {
        packageName: 'buffer',
        packageNamespace: 'pkg:npm',
      },
      uuid_2: {
        packageName: 'numpy',
        packageNamespace: 'pkg:pip',
      },
      uuid_3: {
        packageName: 'pandas',
        packageNamespace: 'pkg:pip',
      },
    };

    const testResourcesToAttributions: ResourcesToAttributions = {
      '/samplepath/subfolder1': ['uuid_0', 'uuid_1'],
      '/samplepath/subfolder2/subsubfolder1': ['uuid_2', 'uuid_1'],
      '/samplepath/subfolder2/subsubfolder2': ['uuid_3'],
    };

    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions)
    );
    renderComponentWithStore(<AttributionWizardPopup />, {
      store: testStore,
    });

    expect(screen.getByText(namespaceListTitle)).toBeInTheDocument();
    expect(screen.getByText(nameListTitle)).toBeInTheDocument();
    expect(screen.queryByText(versionListTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('buffer'));
    fireEvent.click(screen.getByText('pkg:npm'));
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
    const selectedResourceId = '/samplepath/';

    const testAttributions: Attributions = {
      uuid_0: {
        packageName: 'boost',
        packageNamespace: 'pkg:npm',
      },
      uuid_1: {
        packageName: 'buffer',
        packageNamespace: 'pkg:npm',
      },
      uuid_2: {
        packageName: 'numpy',
        packageNamespace: 'pkg:pip',
      },
      uuid_3: {
        packageName: 'pandas',
        packageNamespace: 'pkg:pip',
      },
    };

    const testResourcesToAttributions: ResourcesToAttributions = {
      '/samplepath/subfolder1': ['uuid_0', 'uuid_1'],
      '/samplepath/subfolder2/subsubfolder1': ['uuid_2', 'uuid_1'],
      '/samplepath/subfolder2/subsubfolder2': ['uuid_3'],
    };

    testStore.dispatch(setSelectedResourceId(selectedResourceId));
    testStore.dispatch(
      setExternalData(testAttributions, testResourcesToAttributions)
    );
    renderComponentWithStore(<AttributionWizardPopup />, { store: testStore });

    expect(screen.getByText(namespaceListTitle)).toBeInTheDocument();
    expect(screen.getByText(nameListTitle)).toBeInTheDocument();
    expect(screen.queryByText(versionListTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('buffer'));
    fireEvent.click(screen.getByText('pkg:npm'));
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
