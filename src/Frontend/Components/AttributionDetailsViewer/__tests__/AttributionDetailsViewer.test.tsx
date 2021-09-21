// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent } from '@testing-library/react';
import React from 'react';
import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import { DiscreteConfidence, View } from '../../../enums/enums';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer';
import { IpcRenderer } from 'electron';
import { getParsedInputFile } from '../../../test-helpers/test-helpers';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setTemporaryPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';

let originalIpcRenderer: IpcRenderer;

describe('The AttributionDetailsViewer', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders TextBoxes with right titles and content', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      comment: 'some comment',
      packageName: 'Some package',
      packageVersion: '16.5.0',
      copyright: 'Copyright Doe 2019',
      licenseText: 'Permission is hereby granted',
    };
    const { queryAllByText, getByDisplayValue, store } =
      renderComponentWithStore(<AttributionDetailsViewer />);
    store.dispatch(setSelectedAttributionId('test_id'));
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(queryAllByText('Confidence')).toBeTruthy();
    expect(
      getByDisplayValue(
        (
          testTemporaryPackageInfo.attributionConfidence as unknown as number
        ).toString()
      )
    );
    expect(queryAllByText('Comment')).toBeTruthy();
    expect(getByDisplayValue(testTemporaryPackageInfo.comment as string));
    expect(queryAllByText('Name')).toBeTruthy();
    expect(getByDisplayValue(testTemporaryPackageInfo.packageName as string));
    expect(queryAllByText('Version')).toBeTruthy();
    expect(
      getByDisplayValue(testTemporaryPackageInfo.packageVersion as string)
    );
    expect(queryAllByText('Copyright')).toBeTruthy();
    expect(getByDisplayValue(testTemporaryPackageInfo.copyright as string));
    expect(
      queryAllByText('License Text (to appear in attribution document)')
    ).toBeTruthy();
    expect(getByDisplayValue('Permission is hereby granted', { exact: false }));
  });

  test('saves temporary info', () => {
    const expectedPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageName: 'React',
    };
    const manualAttributions: Attributions = {
      uuid_1: {
        packageName: 'JQuery',
      },
    };
    const { getByRole, getByText, store } = renderComponentWithStore(
      <AttributionDetailsViewer />
    );
    store.dispatch(loadFromFile(getParsedInputFile({}, manualAttributions)));
    store.dispatch(navigateToView(View.Attribution));
    store.dispatch(setSelectedAttributionId('uuid_1'));
    store.dispatch(setTemporaryPackageInfo(expectedPackageInfo));
    expect(getByText('React'));

    fireEvent.click(getByRole('button', { name: 'Save' }) as Element);
    expect(getManualAttributions(store.getState()).uuid_1).toEqual(
      expectedPackageInfo
    );
  });
});
