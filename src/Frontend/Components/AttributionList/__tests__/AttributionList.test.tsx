// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { doNothing } from '../../../util/do-nothing';
import { AttributionList } from '../AttributionList';
import {
  createTestAppStore,
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  clickOnButtonInPackageContextMenu,
  expectButtonInPackageContextMenu,
  expectGlobalOnlyContextMenuForNotPreselectedAttribution,
  testCorrectMarkAndUnmarkForReplacementInContextMenu,
} from '../../../test-helpers/context-menu-test-helpers';
import { ButtonText } from '../../../enums/enums';
import { DisplayAttributionWithCount } from '../../../types/types';

function getTestStore(manualAttributions: Attributions): EnhancedTestStore {
  const store = createTestAppStore();
  store.dispatch(
    loadFromFile(
      getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      })
    )
  );
  return store;
}

describe('The AttributionList', () => {
  const testDisplayAttributions: Array<DisplayAttributionWithCount> = [
    {
      attributionId: 'uuid_1',
      attribution: {
        attributionConfidence: 0,
        comments: ['Some comment'],
        packageName: 'Test package',
        packageVersion: '1.0',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
        firstParty: true,
        attributionIds: ['uuid_1'],
      },
    },
  ];

  const attributions: Attributions = {
    uuid_1: {
      attributionConfidence: 0,
      comment: 'Some comment',
      packageName: 'Test package',
      packageVersion: '1.0',
      copyright: 'Copyright John Doe',
      licenseText: 'Some license text',
      firstParty: true,
    },
  };

  const mockCallback = jest.fn((attributionId: string) => {
    return attributionId;
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders', () => {
    renderComponentWithStore(
      <AttributionList
        displayAttributions={testDisplayAttributions}
        selectedAttributionId={''}
        onCardClick={mockCallback}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(attributions) }
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(mockCallback.mock.calls.length).toBe(0);
  });

  it('renders first party icon', () => {
    renderComponentWithStore(
      <AttributionList
        displayAttributions={testDisplayAttributions}
        selectedAttributionId={''}
        onCardClick={doNothing}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(attributions) }
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByLabelText('First party icon'));
  });

  it('sets selectedAttributionId on click', () => {
    renderComponentWithStore(
      <AttributionList
        displayAttributions={testDisplayAttributions}
        selectedAttributionId={''}
        onCardClick={mockCallback}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(attributions) }
    );
    const attributionCard = screen.getByText('Test package, 1.0');
    expect(attributionCard).toBeInTheDocument();
    fireEvent.click(attributionCard);
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe('uuid_1');
  });

  it('shows correct replace attribution buttons in the context menu', () => {
    const testResources: Resources = {
      root: { src: { file_1: 1, file_2: 1 } },
      file: 1,
    };
    const testDisplayAttributionsWithCount: Array<DisplayAttributionWithCount> =
      [
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
      '/root/src/file_1': ['uuid_1', 'uuid_2', 'uuid_3'],
      '/root/src/file_2': ['uuid_2'],
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
      <AttributionList
        displayAttributions={testDisplayAttributionsWithCount}
        selectedAttributionId={''}
        onCardClick={mockCallback}
        maxHeight={1000}
        title={'title'}
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
