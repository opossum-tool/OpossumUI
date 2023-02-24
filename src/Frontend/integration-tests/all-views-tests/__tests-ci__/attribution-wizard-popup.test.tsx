// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { GlobalPopup } from '../../../Components/GlobalPopup/GlobalPopup';
import { PopupType, ButtonText } from '../../../enums/enums';
import { openAttributionWizardPopup } from '../../../state/actions/popup-actions/popup-actions';
import {
  setExternalData,
  setManualData,
  setTemporaryPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';

const selectedResourceId = '/samplepath/';
const testManualAttributions: Attributions = {
  uuid_0: {
    packageType: 'generic',
    packageName: 'react',
    packageNamespace: 'npm',
    packageVersion: '18.2.0',
  },
};
const testManualResourcesToAttributions: ResourcesToAttributions = {
  [selectedResourceId]: ['uuid_0'],
};
const testExternalAttributions: Attributions = {
  uuid_1: {
    packageType: 'generic',
    packageName: 'numpy',
    packageNamespace: 'pip',
    packageVersion: '1.24.1',
  },
};
const testExternalResourcesToAttributions: ResourcesToAttributions = {
  '/samplepath/file': ['uuid_1'],
};

describe('AttributionWizardPopup', () => {
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
      testStore.dispatch(openAttributionWizardPopup('uuid_0'));
    });

    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.AttributionWizardPopup
    );

    fireEvent.click(screen.getByRole('button', { name: ButtonText.Cancel }));

    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('changes temporary package info', () => {
    const initialTemporaryPackageInfo = testManualAttributions.uuid_0;
    const expectedChangedTemporaryPackageInfo = testExternalAttributions.uuid_1;

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
      testStore.dispatch(openAttributionWizardPopup('uuid_0'));
    });

    testStore.dispatch(setTemporaryPackageInfo(initialTemporaryPackageInfo));

    fireEvent.click(screen.getByText('pip'));
    fireEvent.click(screen.getByText('numpy'));
    fireEvent.click(screen.getByRole('button', { name: ButtonText.Next }));
    fireEvent.click(screen.getByText('1.24.1'));
    fireEvent.click(screen.getByRole('button', { name: ButtonText.Apply }));

    const changedTemporaryPackageInfo = getTemporaryPackageInfo(
      testStore.getState()
    );
    expect(changedTemporaryPackageInfo).toEqual(
      expectedChangedTemporaryPackageInfo
    );
  });
});
