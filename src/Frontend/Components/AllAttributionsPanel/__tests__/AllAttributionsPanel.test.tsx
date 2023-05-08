// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { AllAttributionsPanel } from '../AllAttributionsPanel';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { ButtonText } from '../../../enums/enums';
import {
  clickOnButtonInPackageContextMenu,
  expectButtonInPackageContextMenu,
  expectGlobalOnlyContextMenuForNotPreselectedAttribution,
  testCorrectMarkAndUnmarkForReplacementInContextMenu,
} from '../../../test-helpers/context-menu-test-helpers';
import { DisplayAttributionWithCount } from '../../../types/types';

describe('The AllAttributionsPanel', () => {
  const testManualAttributionUuid1 = '374ba87a-f68b-11ea-adc1-0242ac120002';
  const testManualAttributionUuid2 = '374bac4e-f68b-11ea-adc1-0242ac120002';
  const testManualAttributionUuid3 = '374bar8a-f68b-11ea-adc1-0242ac120002';
  const testManualDisplayAttributions: Array<DisplayAttributionWithCount> = [
    {
      attributionId: testManualAttributionUuid1,
      attribution: {
        packageVersion: '1.0',
        packageName: 'Typescript',
        licenseText: ' test License text',
        attributionIds: [testManualAttributionUuid1],
      },
    },
    {
      attributionId: testManualAttributionUuid2,
      attribution: {
        packageVersion: '2.0',
        packageName: 'React',
        licenseText: ' test license text',
        attributionIds: [testManualAttributionUuid2],
      },
    },
    {
      attributionId: testManualAttributionUuid3,
      attribution: {
        packageVersion: '3.0',
        packageName: 'Vue',
        licenseText: ' test license text',
        attributionIds: [testManualAttributionUuid3],
      },
    },
  ];
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

  it('renders empty list', () => {
    renderComponentWithStore(
      <AllAttributionsPanel
        displayAttributions={[]}
        selectedAttributionId={null}
        isAddToPackageEnabled={true}
      />
    );
  });

  it('renders non-empty list', () => {
    const testDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        attribution: { packageName: 'name 1', attributionIds: ['uuid1'] },
      },
      {
        attributionId: 'uuid2',
        attribution: { packageName: 'name 2', attributionIds: ['uuid2'] },
      },
    ];
    const testAttributions: Attributions = {
      uuid1: { packageName: 'name 1' },
      uuid2: { packageName: 'name 2' },
    };
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testAttributions,
        })
      )
    );
    renderComponentWithStore(
      <AllAttributionsPanel
        displayAttributions={testDisplayAttributions}
        selectedAttributionId={null}
        isAddToPackageEnabled={true}
      />,
      { store: testStore }
    );
    screen.getByText('name 1');
    screen.getByText('name 2');
  });

  it('does not show resource attribution of selected resource and next attributed parent', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          manualAttributions: testManualAttributions,
        })
      )
    );
    const { store } = renderComponentWithStore(
      <AllAttributionsPanel
        displayAttributions={testManualDisplayAttributions}
        selectedAttributionId={testManualAttributionUuid2}
        isAddToPackageEnabled={true}
      />,
      { store: testStore }
    );

    store.dispatch(setSelectedResourceId('/root/'));
    expect(screen.getByText('Typescript, 1.0')).toBeInTheDocument();
    expect(screen.getByText('React, 2.0')).toBeInTheDocument();
    expect(screen.getByText('Vue, 3.0')).toBeInTheDocument();
  });

  it('shows correct replace attribution buttons in the context menu', () => {
    const testResources: Resources = {
      root: { src: { file_1: 1, file_2: 1 } },
      file: 1,
    };
    const testManualDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid_1',
        attribution: {
          packageName: 'jQuery',
          packageVersion: '16.0.0',
          comments: ['ManualPackage'],
          attributionIds: ['uuid_1'],
        },
      },
      {
        attributionId: 'uuid_2',
        attribution: {
          packageName: 'React',
          packageVersion: '16.0.0',
          comments: ['ManualPackage'],
          attributionIds: ['uuid_2'],
        },
      },
      {
        attributionId: 'uuid_3',
        attribution: {
          packageName: 'Vue',
          packageVersion: '16.0.0',
          comments: ['ManualPackage'],
          preSelected: true,
          attributionIds: ['uuid_3'],
        },
      },
    ];
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
      },
      uuid_2: {
        packageName: 'React',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
      },
      uuid_3: {
        packageName: 'Vue',
        packageVersion: '16.0.0',
        comment: 'ManualPackage',
        preSelected: true,
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/file_1': ['uuid_1'],
      '/root/src/file_2': ['uuid_2', 'uuid_3'],
    };

    const testStore = createTestAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions: testResourcesToManualAttributions,
        })
      )
    );
    renderComponentWithStore(
      <AllAttributionsPanel
        displayAttributions={testManualDisplayAttributions}
        selectedAttributionId={null}
        isAddToPackageEnabled={true}
      />,
      { store: testStore }
    );

    expectGlobalOnlyContextMenuForNotPreselectedAttribution(
      screen,
      'jQuery, 16.0.0'
    );

    testCorrectMarkAndUnmarkForReplacementInContextMenu(
      screen,
      'jQuery, 16.0.0'
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'jQuery, 16.0.0',
      ButtonText.MarkForReplacement
    );

    expectButtonInPackageContextMenu(
      screen,
      'Vue, 16.0.0',
      ButtonText.ReplaceMarked
    );

    expectGlobalOnlyContextMenuForNotPreselectedAttribution(
      screen,
      'React, 16.0.0',
      true
    );
  });
});
