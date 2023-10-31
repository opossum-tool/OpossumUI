// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { ButtonText } from '../../../enums/enums';
import { ADD_NEW_ATTRIBUTION_BUTTON_TEXT } from '../../../shared-constants';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import {
  clickOnButtonInPackageContextMenu,
  expectButtonInPackageContextMenu,
  expectContextMenuForNotPreSelectedAttributionMultipleResources,
  expectContextMenuForNotPreSelectedAttributionSingleResource,
  testCorrectMarkAndUnmarkForReplacementInContextMenu,
} from '../../../test-helpers/context-menu-test-helpers';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import {
  createTestAppStore,
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { DisplayPackageInfos } from '../../../types/types';
import { doNothing } from '../../../util/do-nothing';
import { ManualAttributionList } from '../ManualAttributionList';

function getTestStore(manualAttributions: Attributions): EnhancedTestStore {
  const store = createTestAppStore();
  store.dispatch(
    loadFromFile(
      getParsedInputFileEnrichedWithTestData({
        manualAttributions,
      }),
    ),
  );
  return store;
}

describe('The ManualAttributionList', () => {
  const testSortedPackageCardIds = ['Manual Attributions-0'];
  const testDisplayPackageInfos: DisplayPackageInfos = {
    [testSortedPackageCardIds[0]]: {
      attributionConfidence: 0,
      comments: ['Some comment'],
      packageName: 'Test package',
      packageVersion: '1.0',
      copyright: 'Copyright John Doe',
      licenseText: 'Some license text',
      firstParty: true,
      attributionIds: ['1'],
    },
  };

  const packages: Attributions = {
    '1': {
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
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        sortedPackageCardIds={testSortedPackageCardIds}
        selectedPackageCardId={''}
        onCardClick={mockCallback}
      />,
      { store: getTestStore(packages) },
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(mockCallback.mock.calls.length).toBe(0);
  });

  it('renders first party icon and show resources icon', () => {
    renderComponentWithStore(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        sortedPackageCardIds={testSortedPackageCardIds}
        selectedPackageCardId={''}
        onCardClick={doNothing}
      />,
      { store: getTestStore(packages) },
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.getAllByLabelText('show resources'));
  });

  it('renders button', () => {
    renderComponentWithStore(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        sortedPackageCardIds={testSortedPackageCardIds}
        selectedPackageCardId={''}
        isAddNewAttributionItemShown={true}
        onCardClick={mockCallback}
      />,
      { store: getTestStore(packages) },
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByText(ADD_NEW_ATTRIBUTION_BUTTON_TEXT));
    expect(mockCallback.mock.calls.length).toBe(0);
  });

  it('sets selectedAttributionId on click', () => {
    renderComponentWithStore(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        sortedPackageCardIds={testSortedPackageCardIds}
        selectedPackageCardId={''}
        onCardClick={mockCallback}
      />,
      { store: getTestStore(packages) },
    );
    const attributionCard = screen.getByText('Test package, 1.0');
    expect(attributionCard).toBeInTheDocument();
    fireEvent.click(attributionCard);
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe(testSortedPackageCardIds[0]);
  });

  it('shows correct replace attribution buttons in the context menu', () => {
    const testResources: Resources = {
      root: { src: { file_1: 1, file_2: 1 } },
      file: 1,
    };
    const testSortedPackageCardIds = [
      'Manual Attributions-0',
      'Manual Attributions-1',
      'Manual Attributions-2',
    ];
    const testDisplayPackageInfos: DisplayPackageInfos = {
      [testSortedPackageCardIds[0]]: {
        packageName: 'jQuery',
        packageVersion: '16.0.0',
        comments: ['ManualPackage'],
        attributionIds: ['uuid_1'],
      },

      [testSortedPackageCardIds[1]]: {
        packageName: 'React',
        packageVersion: '16.0.0',
        comments: ['ManualPackage'],
        attributionIds: ['uuid_2'],
      },

      [testSortedPackageCardIds[2]]: {
        packageName: 'Vue',
        packageVersion: '16.0.0',
        comments: ['ManualPackage'],
        preSelected: true,
        attributionIds: ['uuid_3'],
      },
    };

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
        }),
      ),
    );
    renderComponentWithStore(
      <ManualAttributionList
        selectedResourceId="/root/src/file_1"
        displayPackageInfos={testDisplayPackageInfos}
        sortedPackageCardIds={testSortedPackageCardIds}
        selectedPackageCardId={''}
        onCardClick={mockCallback}
      />,
      { store: testStore },
    );

    expectContextMenuForNotPreSelectedAttributionSingleResource(
      screen,
      'jQuery, 16.0.0',
    );

    testCorrectMarkAndUnmarkForReplacementInContextMenu(
      screen,
      'jQuery, 16.0.0',
    );

    clickOnButtonInPackageContextMenu(
      screen,
      'jQuery, 16.0.0',
      ButtonText.MarkForReplacement,
    );

    expectButtonInPackageContextMenu(
      screen,
      'Vue, 16.0.0',
      ButtonText.ReplaceMarked,
    );

    expectContextMenuForNotPreSelectedAttributionMultipleResources(
      screen,
      'React, 16.0.0',
      true,
    );
  });
});
