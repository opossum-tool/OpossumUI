// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import {
  Attributions,
  DisplayPackageInfo,
  Resources,
} from '../../../../shared/shared-types';
import { ButtonText, PopupType, View } from '../../../enums/enums';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  navigateToView,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { convertDisplayPackageInfoToPackageInfo } from '../../../util/convert-package-info';
import { EditAttributionPopup } from '../EditAttributionPopup';

describe('The EditAttributionPopup', () => {
  const testResources: Resources = {
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
    },
  };
  const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
    attributionConfidence: 20,
    packageName: 'jQuery',
    packageVersion: '16.5.0',
    packagePURLAppendix: '?appendix',
    packageNamespace: 'namespace',
    packageType: 'type',
    comments: ['some comment'],
    copyright: 'Copyright Doe Inc. 2019',
    licenseText: 'Permission is hereby granted',
    licenseName: 'Made up license name',
    url: 'www.1999.com',
    attributionIds: [],
  };
  const testAttributions: Attributions = {
    test_selected_id: convertDisplayPackageInfoToPackageInfo(
      testTemporaryDisplayPackageInfo,
    ),
    test_marked_id: { packageName: 'Vue' },
  };
  const testResourcesToManualAttributions = {
    'package_1.tr.gz': ['test_selected_id'],
    'package_2.tr.gz': ['test_marked_id'],
  };

  it('renders and clicks cancel closes the popup', () => {
    const expectedHeader = 'Edit Attribution';
    const { store } = renderComponentWithStore(<EditAttributionPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id'),
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        }),
      ),
    );
    act(() => {
      store.dispatch(setSelectedAttributionId('test_selected_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo({
          ...testTemporaryDisplayPackageInfo,
          attributionIds: ['test_selected_id'],
        }),
      );
    });

    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
  });

  it('renders and clicks cancel opens NotSavedPopup if package info has been changed', () => {
    const expectedHeader = 'Edit Attribution';
    const { store } = renderComponentWithStore(<EditAttributionPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id'),
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        }),
      ),
    );
    const changedTestTemporaryDisplayPackageInfo = {
      ...testTemporaryDisplayPackageInfo,
      comment: 'changed comment',
    };

    act(() => {
      store.dispatch(setSelectedAttributionId('test_selected_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(changedTestTemporaryDisplayPackageInfo),
      );
    });

    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(PopupType.NotSavedPopup);
  });

  it('renders and clicks save saves changed  package info', () => {
    const expectedHeader = 'Edit Attribution';
    const { store } = renderComponentWithStore(<EditAttributionPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id'),
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        }),
      ),
    );
    const changedTestTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      ...testTemporaryDisplayPackageInfo,
      attributionIds: ['test_selected_id'],
      comments: ['changed comment'],
    };
    act(() => {
      store.dispatch(setSelectedAttributionId('test_selected_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(changedTestTemporaryDisplayPackageInfo),
      );
    });

    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    expect(screen.getByDisplayValue('jQuery')).toBeInTheDocument();

    fireEvent.click(screen.queryByText(ButtonText.Save) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
    const resultingTemporaryDisplayPackageInfo = getTemporaryDisplayPackageInfo(
      store.getState(),
    );

    expect(resultingTemporaryDisplayPackageInfo.comments).toEqual(
      changedTestTemporaryDisplayPackageInfo.comments,
    );
  });
});
