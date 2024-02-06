// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { Attributions } from '../../../../shared/shared-types';
import { ADD_NEW_ATTRIBUTION_BUTTON_TEXT } from '../../../shared-constants';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { doNothing } from '../../../util/do-nothing';
import { ManualAttributionList } from '../ManualAttributionList';

describe('The ManualAttributionList', () => {
  const testSortedPackageCardIds = ['Manual Attributions-0'];
  const testDisplayPackageInfos: Attributions = {
    [testSortedPackageCardIds[0]]: {
      attributionConfidence: 0,
      comment: 'Some comment',
      packageName: 'Test package',
      packageVersion: '1.0',
      copyright: 'Copyright John Doe',
      licenseText: 'Some license text',
      firstParty: true,
      id: testSortedPackageCardIds[0],
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
      id: '1',
    },
  };
  const mockCallback = jest.fn((attributionId: string) => {
    return attributionId;
  });

  it('renders', () => {
    renderComponent(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        selectedPackageCardId={''}
        onCardClick={mockCallback}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: packages,
            }),
          ),
        ],
      },
    );
    expect(screen.getByText('Test package, 1.0')).toBeInTheDocument();
    expect(mockCallback.mock.calls).toHaveLength(0);
  });

  it('renders first party icon and show resources icon', () => {
    renderComponent(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        selectedPackageCardId={''}
        onCardClick={doNothing}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: packages,
            }),
          ),
        ],
      },
    );
    expect(screen.getByText('Test package, 1.0')).toBeInTheDocument();
    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
    expect(screen.getAllByLabelText('show resources')).not.toHaveLength(0);
  });

  it('renders button', () => {
    renderComponent(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        selectedPackageCardId={''}
        isAddNewAttributionItemShown={true}
        onCardClick={mockCallback}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: packages,
            }),
          ),
        ],
      },
    );
    expect(screen.getByText('Test package, 1.0')).toBeInTheDocument();
    expect(
      screen.getByText(ADD_NEW_ATTRIBUTION_BUTTON_TEXT),
    ).toBeInTheDocument();
    expect(mockCallback.mock.calls).toHaveLength(0);
  });

  it('sets selectedAttributionId on click', () => {
    renderComponent(
      <ManualAttributionList
        selectedResourceId="/folder/"
        displayPackageInfos={testDisplayPackageInfos}
        selectedPackageCardId={''}
        onCardClick={mockCallback}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              manualAttributions: packages,
            }),
          ),
        ],
      },
    );
    const attributionCard = screen.getByText('Test package, 1.0');
    expect(attributionCard).toBeInTheDocument();
    fireEvent.click(attributionCard);
    expect(mockCallback.mock.calls).toHaveLength(1);
    expect(mockCallback.mock.calls[0][0]).toBe(testSortedPackageCardIds[0]);
  });
});
