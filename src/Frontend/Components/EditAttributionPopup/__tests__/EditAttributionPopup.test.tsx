// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { EditAttributionPopup } from '../EditAttributionPopup';
import {
  Attributions,
  PackageInfo,
  Resources,
} from '../../../../shared/shared-types';
import {
  navigateToView,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import { ButtonText, PopupType, View } from '../../../enums/enums';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { setTemporaryPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';

describe('The EditAttributionPopup', () => {
  const testResources: Resources = {
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
    },
  };
  const testTemporaryPackageInfo: PackageInfo = {
    attributionConfidence: 20,
    packageName: 'jQuery',
    packageVersion: '16.5.0',
    packagePURLAppendix: '?appendix',
    packageNamespace: 'namespace',
    packageType: 'type',
    comment: 'some comment',
    copyright: 'Copyright Doe Inc. 2019',
    licenseText: 'Permission is hereby granted',
    licenseName: 'Made up license name',
    url: 'www.1999.com',
  };
  const testAttributions: Attributions = {
    test_selected_id: testTemporaryPackageInfo,
    test_marked_id: { packageName: 'Vue' },
  };
  const testResourcesToManualAttributions = {
    'package_1.tr.gz': ['test_selected_id'],
    'package_2.tr.gz': ['test_marked_id'],
  };

  test('renders and clicks cancel closes the popup', () => {
    const expectedHeader = 'Edit Attribution';
    const { store } = renderComponentWithStore(<EditAttributionPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id')
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    store.dispatch(setSelectedAttributionId('test_selected_id'));
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
  });

  test('renders and clicks cancel opens NotSavedPopup if package info has been changed', () => {
    const expectedHeader = 'Edit Attribution';
    const { store } = renderComponentWithStore(<EditAttributionPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id')
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    const changedTestTemporaryPackageInfo = {
      ...testTemporaryPackageInfo,
      comment: 'changed comment',
    };

    store.dispatch(setSelectedAttributionId('test_selected_id'));
    store.dispatch(setTemporaryPackageInfo(changedTestTemporaryPackageInfo));

    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(PopupType.NotSavedPopup);
  });

  test('renders and clicks save saves changed  package info', () => {
    const expectedHeader = 'Edit Attribution';
    const { store } = renderComponentWithStore(<EditAttributionPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id')
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    const changedTestTemporaryPackageInfo = {
      ...testTemporaryPackageInfo,
      comment: 'changed comment',
    };

    store.dispatch(setSelectedAttributionId('test_selected_id'));
    store.dispatch(setTemporaryPackageInfo(changedTestTemporaryPackageInfo));

    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Save) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
    expect(getTemporaryPackageInfo(store.getState()).comment).toBe(
      changedTestTemporaryPackageInfo.comment
    );
  });
});
