// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AttributionsViewPackageList } from '../AttributionsViewPackageList';
import { DisplayAttributionWithCount } from '../../../types/types';

describe('The AttributionsViewPackageList', () => {
  it('has search functionality', () => {
    const testDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        attribution: {
          packageName: 'name 1',
          licenseText: 'text',
          licenseName: 'license name 2',
          comments: ['comment bla'],
          packageVersion: '1.1.1',
          attributionIds: ['uuid_1'],
        },
      },
      {
        attributionId: 'uuid2',
        attribution: {
          packageName: 'name 2',
          copyright: '(c)',
          comments: ['comment blub'],
          url: 'www.url.de',
          attributionIds: ['uuid_2'],
        },
      },
      {
        attributionId: 'uuid3',
        attribution: {
          packageVersion: 'packageVersion',
          attributionIds: ['uuid_3'],
        },
      },
    ];
    renderComponentWithStore(
      <AttributionsViewPackageList
        displayAttributions={testDisplayAttributions}
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
    expect(screen.queryByText('uuid2')).not.toBeInTheDocument();
    expect(screen.queryByText('uuid3')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'name' },
    });
    screen.getByText('uuid1');
    screen.getByText('uuid2');
    expect(screen.queryByText('uuid3')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '(C)' },
    });
    expect(screen.queryByText('uuid1')).not.toBeInTheDocument();
    screen.getByText('uuid2');
    expect(screen.queryByText('uuid3')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'NAME 2' },
    });
    screen.getByText('uuid1');
    screen.getByText('uuid2');
    expect(screen.queryByText('uuid3')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'comment' },
    });
    expect(screen.queryByText('uuid1')).not.toBeInTheDocument();
    expect(screen.queryByText('uuid2')).not.toBeInTheDocument();
    expect(screen.queryByText('uuid3')).not.toBeInTheDocument();
  });
});
