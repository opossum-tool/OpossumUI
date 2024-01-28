// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  setManualData,
  setTemporaryDisplayPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ResourceDetailsAttributionColumn } from '../ResourceDetailsAttributionColumn';

const testManualLicense = 'Manual attribution license.';
const testManualLicense2 = 'Another manual attribution license.';
const testTemporaryDisplayPackageInfo: PackageInfo = {
  packageName: 'React',
  packageVersion: '16.5.0',
  licenseText: testManualLicense,
  id: 'uuid_1',
};
const testTemporaryDisplayPackageInfo2: PackageInfo = {
  packageName: 'Vue.js',
  packageVersion: '2.6.11',
  licenseText: testManualLicense2,
  id: 'uuid_2',
};

function getActions(
  selectedResourceId: string,
  temporaryDisplayPackageInfo: PackageInfo,
) {
  const manualAttributions: Attributions = {
    uuid_1: testTemporaryDisplayPackageInfo,
    uuid_2: testTemporaryDisplayPackageInfo2,
  };
  const resourcesToManualAttributions: ResourcesToAttributions = {
    '/test_parent': ['uuid_1'],
    '/test_parent/test_child_with_own_attr': ['uuid_2'],
  };

  return [
    loadFromFile(
      getParsedInputFileEnrichedWithTestData({
        manualAttributions,
        resourcesToManualAttributions,
      }),
    ),
    setManualData(manualAttributions, resourcesToManualAttributions),
    setSelectedResourceId(selectedResourceId),
    setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
  ];
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
      id: faker.string.uuid(),
    } satisfies PackageInfo;
    const { store } = renderComponent(
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
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    const testComment =
      testTemporaryDisplayPackageInfo?.comments !== undefined
        ? testTemporaryDisplayPackageInfo?.comments[0]
        : '';
    expect(screen.getByDisplayValue(testComment)).toBeInTheDocument();
    expect(
      screen.getByLabelText(text.attributionColumn.packageSubPanel.packageName),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageName),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.packageVersion,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.packageVersion),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Copyright')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(testTemporaryDisplayPackageInfo.copyright),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('License Text (to appear in attribution document)'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Permission is hereby granted', {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it('shows parent attribution if overrideParentMode is true', () => {
    renderComponent(
      <ResourceDetailsAttributionColumn showParentAttributions={true} />,
      {
        actions: getActions(
          '/test_parent/test_child',
          testTemporaryDisplayPackageInfo,
        ),
      },
    );

    expect(screen.getByDisplayValue('React')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16.5.0')).toBeInTheDocument();
    expect(screen.getByDisplayValue(testManualLicense)).toBeInTheDocument();
  });

  it('does not show parent attribution if overrideParentMode is false', () => {
    renderComponent(
      <ResourceDetailsAttributionColumn showParentAttributions={false} />,
      {
        actions: getActions(
          '/test_parent/test_child',
          testTemporaryDisplayPackageInfo2,
        ),
      },
    );
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.queryByText('16.5.0')).not.toBeInTheDocument();
    expect(screen.queryByText(testManualLicense)).not.toBeInTheDocument();
  });
});
