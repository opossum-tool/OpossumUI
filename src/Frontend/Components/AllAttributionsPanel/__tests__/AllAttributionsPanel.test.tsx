// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { Attributions } from '../../../../shared/shared-types';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { DisplayPackageInfos } from '../../../types/types';
import { AllAttributionsPanel } from '../AllAttributionsPanel';

describe('The AllAttributionsPanel', () => {
  const testManualAttributionUuid1 = '374ba87a-f68b-11ea-adc1-0242ac120002';
  const testManualAttributionUuid2 = '374bac4e-f68b-11ea-adc1-0242ac120002';
  const testManualAttributionUuid3 = '374bar8a-f68b-11ea-adc1-0242ac120002';
  const testPackageCardId1 = 'All Attributions-0';
  const testPackageCardId2 = 'All Attributions-1';
  const testPackageCardId3 = 'All Attributions-2';
  const testManualDisplayPackageInfos: DisplayPackageInfos = {
    [testPackageCardId1]: {
      packageVersion: '1.0',
      packageName: 'Typescript',
      licenseText: ' test License text',
      attributionIds: [testManualAttributionUuid1],
    },
    [testPackageCardId2]: {
      packageVersion: '2.0',
      packageName: 'React',
      licenseText: ' test license text',
      attributionIds: [testManualAttributionUuid2],
    },
    [testPackageCardId3]: {
      packageVersion: '3.0',
      packageName: 'Vue',
      licenseText: ' test license text',
      attributionIds: [testManualAttributionUuid3],
    },
  };
  const testManualAttributions: Attributions = {
    [testManualAttributionUuid1]: {
      packageVersion: '1.0',
      packageName: 'Typescript',
      licenseText: ' test License text',
    },
    [testManualAttributionUuid2]: {
      packageVersion: '2.0',
      packageName: 'React',
      licenseText: ' test license text',
    },
    [testManualAttributionUuid3]: {
      packageVersion: '3.0',
      packageName: 'Vue',
      licenseText: ' test license text',
    },
  };

  it('renders non-empty list', () => {
    const testDisplayPackageInfos: DisplayPackageInfos = {
      [testPackageCardId1]: {
        packageName: 'name 1',
        attributionIds: ['uuid1'],
      },

      [testPackageCardId2]: {
        packageName: 'name 2',
        attributionIds: ['uuid2'],
      },
    };
    const testAttributions: Attributions = {
      uuid1: { packageName: 'name 1' },
      uuid2: { packageName: 'name 2' },
    };
    renderComponent(
      <AllAttributionsPanel
        displayPackageInfos={testDisplayPackageInfos}
        isAddToPackageEnabled={true}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: testAttributions,
            }),
          ),
        ],
      },
    );
    expect(screen.getByText('name 1')).toBeInTheDocument();
    expect(screen.getByText('name 2')).toBeInTheDocument();
  });

  it('does not show resource attribution of selected resource and next attributed parent', () => {
    const { store } = renderComponent(
      <AllAttributionsPanel
        displayPackageInfos={testManualDisplayPackageInfos}
        selectedPackageCardId={testManualAttributionUuid2}
        isAddToPackageEnabled={true}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: testManualAttributions,
            }),
          ),
        ],
      },
    );

    store.dispatch(setSelectedResourceId('/root/'));
    expect(screen.getByText('Typescript, 1.0')).toBeInTheDocument();
    expect(screen.getByText('React, 2.0')).toBeInTheDocument();
    expect(screen.getByText('Vue, 3.0')).toBeInTheDocument();
  });
});
