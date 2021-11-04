// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { Attributions } from '../../../../shared/shared-types';
import { doNothing } from '../../../util/do-nothing';
import { AttributionList } from '../AttributionList';
import {
  createTestAppStore,
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/test-helpers';

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

  test('renders', () => {
    renderComponentWithStore(
      <AttributionList
        attributions={packages}
        selectedAttributionId={''}
        attributionIdMarkedForReplacement={''}
        onCardClick={mockCallback}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(packages) }
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(mockCallback.mock.calls.length).toBe(0);
  });

  test('renders first party icon', () => {
    renderComponentWithStore(
      <AttributionList
        attributions={packages}
        selectedAttributionId={''}
        attributionIdMarkedForReplacement={''}
        onCardClick={doNothing}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(packages) }
    );
    expect(screen.getByText('Test package, 1.0'));
    expect(screen.getByLabelText('First party icon'));
  });

  test('sets selectedAttributionId on click', () => {
    renderComponentWithStore(
      <AttributionList
        attributions={packages}
        selectedAttributionId={''}
        attributionIdMarkedForReplacement={''}
        onCardClick={mockCallback}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(packages) }
    );
    const attributionCard = screen.getByText('Test package, 1.0');
    expect(attributionCard).toBeTruthy();
    fireEvent.click(attributionCard);
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][0]).toBe('1');
  });

  test('sorts its elements', () => {
    const testPackages: Attributions = {
      '1': {
        packageName: 'zz Test package',
      },
      '2': {
        attributionConfidence: 0,
        comment: 'Some comment',
        packageName: 'Test package',
        packageVersion: '1.0',
        copyright: 'Copyright John Doe',
        licenseText: 'Some license text',
      },
      '3': {
        copyright: 'Copyright John Doe 2',
      },
    };
    const { container } = renderComponentWithStore(
      <AttributionList
        attributions={testPackages}
        selectedAttributionId={''}
        attributionIdMarkedForReplacement={''}
        onCardClick={mockCallback}
        maxHeight={1000}
        title={'title'}
      />,
      { store: getTestStore(testPackages) }
    );

    expect(container.childNodes[0].textContent).toContain('zz Test package');
    expect(container.childNodes[0].textContent).toContain(
      'Test package, 1.0Copyright John Doe'
    );
    expect(container.childNodes[0].textContent).toContain(
      'Copyright John Doe 2'
    );
  });
});
