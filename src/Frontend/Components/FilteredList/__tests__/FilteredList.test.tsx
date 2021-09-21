// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent } from '@testing-library/react';
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
    const { getByText, queryByText, getByRole } = renderComponentWithStore(
      <FilteredList
        attributions={testAttributions}
        attributionIds={['uuid1', 'uuid2', 'uuid3']}
        getAttributionCard={(attributionId): ReactElement => (
          <div>{attributionId}</div>
        )}
        max={{ numberOfDisplayedItems: 20 }}
      />
    );
    getByText('uuid1');
    getByText('uuid2');
    getByText('uuid3');

    fireEvent.change(getByRole('searchbox'), {
      target: { value: 'name 1' },
    });
    getByText('uuid1');
    expect(queryByText('uuid2')).toBeNull();
    expect(queryByText('uuid3')).toBeNull();

    fireEvent.change(getByRole('searchbox'), {
      target: { value: 'name' },
    });
    getByText('uuid1');
    getByText('uuid2');
    expect(queryByText('uuid3')).toBeNull();

    fireEvent.change(getByRole('searchbox'), {
      target: { value: '(C)' },
    });
    expect(queryByText('uuid1')).toBeNull();
    getByText('uuid2');
    expect(queryByText('uuid3')).toBeNull();

    fireEvent.change(getByRole('searchbox'), {
      target: { value: 'NAME 2' },
    });
    getByText('uuid1');
    getByText('uuid2');
    expect(queryByText('uuid3')).toBeNull();

    fireEvent.change(getByRole('searchbox'), {
      target: { value: 'comment' },
    });
    expect(queryByText('uuid1')).toBeNull();
    expect(queryByText('uuid2')).toBeNull();
    expect(queryByText('uuid3')).toBeNull();
  });
});
