// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import {
  setManualData,
  setTemporaryDisplayPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { ResourceDetailsAttributionColumn } from '../ResourceDetailsAttributionColumn';

const testManualLicense = 'Manual attribution license.';
const testManualLicense2 = 'Another manual attribution license.';
const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
  packageName: 'React',
  packageVersion: '16.5.0',
  licenseText: testManualLicense,
  attributionIds: [],
};
const testTemporaryDisplayPackageInfo2: DisplayPackageInfo = {
  packageName: 'Vue.js',
  packageVersion: '2.6.11',
  licenseText: testManualLicense2,
  attributionIds: [],
};

function getTestTemporaryAndExternalStateWithParentAttribution(
  store: EnhancedTestStore,
  selectedResourceId: string,
  temporaryDisplayPackageInfo: DisplayPackageInfo,
): void {
  const manualAttributions: Attributions = {
    uuid_1: testTemporaryDisplayPackageInfo,
    uuid_2: testTemporaryDisplayPackageInfo2,
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
        }),
      ),
    );
    store.dispatch(
      setManualData(manualAttributions, resourcesToManualAttributions),
    );
    store.dispatch(setSelectedResourceId(selectedResourceId));
    store.dispatch(setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo));
  });
}

describe('The ResourceDetailsAttributionColumn', () => {
  it('renders TextBoxes with right titles and content', () => {
    const testTemporaryDisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      comments: ['some comment'],
      packageName: 'Some package',
      packageVersion: '16.5.0',
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      attributionIds: [],
    } satisfies DisplayPackageInfo;
    const { store } = renderComponentWithStore(
      <ResourceDetailsAttributionColumn showParentAttributions={true} />,
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByText(text.attributionColumn.packageSubPanel.confidence),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('confidence of 4')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(screen.queryAllByText('Comment'));
    const testComment =
      testTemporaryDisplayPackageInfo?.comments !== undefined
        ? testTemporaryDisplayPackageInfo?.comments[0]
        : '';
    expect(screen.getByDisplayValue(testComment));
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.packageName),
    );
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageName),
    );
    expect(
      screen.queryAllByText(
        text.attributionColumn.packageSubPanel.packageVersion,
      ),
    );
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageVersion),
    );
    expect(screen.queryAllByText('Copyright'));
    expect(screen.getByDisplayValue(testTemporaryDisplayPackageInfo.copyright));
    expect(
      screen.queryAllByText('License Text (to appear in attribution document)'),
    );
    expect(
      screen.getByDisplayValue('Permission is hereby granted', {
        exact: false,
      }),
    );
  });

  it('shows parent attribution if overrideParentMode is true', () => {
    const { store } = renderComponentWithStore(
      <ResourceDetailsAttributionColumn showParentAttributions={true} />,
    );
    getTestTemporaryAndExternalStateWithParentAttribution(
      store,
      '/test_parent/test_child',
      testTemporaryDisplayPackageInfo,
    );

    expect(screen.getByDisplayValue('React'));
    expect(screen.getByDisplayValue('16.5.0'));
    expect(screen.getByDisplayValue(testManualLicense));
  });

  it('does not show parent attribution if overrideParentMode is false', () => {
    const { store } = renderComponentWithStore(
      <ResourceDetailsAttributionColumn showParentAttributions={false} />,
    );
    getTestTemporaryAndExternalStateWithParentAttribution(
      store,
      '/test_parent/test_child',
      testTemporaryDisplayPackageInfo2,
    );

    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.queryByText('16.5.0')).not.toBeInTheDocument();
    expect(screen.queryByText(testManualLicense)).not.toBeInTheDocument();
  });
});
