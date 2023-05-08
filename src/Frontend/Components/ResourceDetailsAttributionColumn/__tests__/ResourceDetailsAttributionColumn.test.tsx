// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { ResourceDetailsAttributionColumn } from '../ResourceDetailsAttributionColumn';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  setManualData,
  setTemporaryPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { act, screen } from '@testing-library/react';

const testManualLicense = 'Manual attribution license.';
const testManualLicense2 = 'Another manual attribution license.';
const testTemporaryPackageInfo: DisplayPackageInfo = {
  packageName: 'React',
  packageVersion: '16.5.0',
  licenseText: testManualLicense,
  attributionIds: [],
};
const testTemporaryPackageInfo2: DisplayPackageInfo = {
  packageName: 'Vue.js',
  packageVersion: '2.6.11',
  licenseText: testManualLicense2,
  attributionIds: [],
};

function getTestTemporaryAndExternalStateWithParentAttribution(
  store: EnhancedTestStore,
  selectedResourceId: string,
  temporaryPackageInfo: DisplayPackageInfo
): void {
  const manualAttributions: Attributions = {
    uuid_1: testTemporaryPackageInfo,
    uuid_2: testTemporaryPackageInfo2,
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/test_parent': ['uuid_1'],
    '/test_parent/test_child_with_own_attr': ['uuid_2'],
  };
  act(() => {
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions,
          resourcesToManualAttributions,
        })
      )
    );
    store.dispatch(
      setManualData(manualAttributions, resourcesToManualAttributions)
    );
    store.dispatch(setSelectedResourceId(selectedResourceId));
    store.dispatch(setTemporaryPackageInfo(temporaryPackageInfo));
  });
}

describe('The ResourceDetailsAttributionColumn', () => {
  it('renders TextBoxes with right titles and content', () => {
    const testTemporaryPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      comments: ['some comment'],
      packageName: 'Some package',
      packageVersion: '16.5.0',
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      attributionIds: [],
    };
    const { store } = renderComponentWithStore(
      <ResourceDetailsAttributionColumn showParentAttributions={true} />
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(screen.queryAllByText('Confidence'));
    expect(
      screen.getByDisplayValue(
        (
          testTemporaryPackageInfo.attributionConfidence as unknown as number
        ).toString()
      )
    );
    expect(screen.queryAllByText('Comment'));
    const testComment =
      testTemporaryPackageInfo?.comments !== undefined
        ? testTemporaryPackageInfo?.comments[0]
        : '';
    expect(screen.getByDisplayValue(testComment));
    expect(screen.queryAllByText('Name'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.packageName as string)
    );
    expect(screen.queryAllByText('Version'));
    expect(
      screen.getByDisplayValue(
        testTemporaryPackageInfo.packageVersion as string
      )
    );
    expect(screen.queryAllByText('Copyright'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.copyright as string)
    );
    expect(
      screen.queryAllByText('License Text (to appear in attribution document)')
    );
    expect(
      screen.getByDisplayValue('Permission is hereby granted', { exact: false })
    );
  });

  it('shows parent attribution if overrideParentMode is true', () => {
    const { store } = renderComponentWithStore(
      <ResourceDetailsAttributionColumn showParentAttributions={true} />
    );
    getTestTemporaryAndExternalStateWithParentAttribution(
      store,
      '/test_parent/test_child',
      testTemporaryPackageInfo
    );

    expect(screen.getByDisplayValue('React'));
    expect(screen.getByDisplayValue('16.5.0'));
    expect(screen.getByDisplayValue(testManualLicense));
  });

  it('does not show parent attribution if overrideParentMode is false', () => {
    const { store } = renderComponentWithStore(
      <ResourceDetailsAttributionColumn showParentAttributions={false} />
    );
    getTestTemporaryAndExternalStateWithParentAttribution(
      store,
      '/test_parent/test_child',
      testTemporaryPackageInfo2
    );

    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.queryByText('16.5.0')).not.toBeInTheDocument();
    expect(screen.queryByText(testManualLicense)).not.toBeInTheDocument();
  });
});
