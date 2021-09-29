// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { Attributions } from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { FilteredList } from '../FilteredList';

describe('The FilteredList', () => {
  test('has search functionality', () => {
    const testAttributions: Attributions = {
      uuid1: {
        packageName: 'name 1',
        licenseText: 'text',
        licenseName: 'license name 2',
        comment: 'comment bla',
        packageVersion: '1.1.1',
      },
      uuid2: {
        packageName: 'name 2',
        copyright: '(c)',
        comment: 'comment blub',
        url: 'www.url.de',
      },
      uuid3: {
        packageVersion: 'packageVersion',
      },
    };
    renderComponentWithStore(
      <FilteredList
        attributions={testAttributions}
        attributionIds={['uuid1', 'uuid2', 'uuid3']}
        getAttributionCard={(attributionId): ReactElement => (
          <div>{attributionId}</div>
        )}
        max={{ numberOfDisplayedItems: 20 }}
      />
    );
    screen.getByText('uuid1');
    screen.getByText('uuid2');
    screen.getByText('uuid3');

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'name 1' },
    });
    screen.getByText('uuid1');
    expect(screen.queryByText('uuid2')).toBeNull();
    expect(screen.queryByText('uuid3')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'name' },
    });
    screen.getByText('uuid1');
    screen.getByText('uuid2');
    expect(screen.queryByText('uuid3')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '(C)' },
    });
    expect(screen.queryByText('uuid1')).toBeNull();
    screen.getByText('uuid2');
    expect(screen.queryByText('uuid3')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'NAME 2' },
    });
    screen.getByText('uuid1');
    screen.getByText('uuid2');
    expect(screen.queryByText('uuid3')).toBeNull();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'comment' },
    });
    expect(screen.queryByText('uuid1')).toBeNull();
    expect(screen.queryByText('uuid2')).toBeNull();
    expect(screen.queryByText('uuid3')).toBeNull();
  });
});
