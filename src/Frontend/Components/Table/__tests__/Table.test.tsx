// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { AttributionsWithResources } from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
import { Table } from '../Table';
import { screen } from '@testing-library/react';
import { DiscreteConfidence } from '../../../enums/enums';

describe('The Table', () => {
  test('renders', () => {
    const testAttributionsWithResources: AttributionsWithResources = {
      uuid1: {
        packageName: 'React',
        packageVersion: '1.0',
        copyright: 'test copyright',
        licenseName: 'licenseName',
        licenseText: 'licenseText',
        attributionConfidence: DiscreteConfidence.Low,
        comment: 'test comment',
        url: 'packageWebsite',
        firstParty: true,
        resources: ['/'],
      },
      uuid2: {
        packageName: 'Redux',
        resources: [],
      },
    };
    renderComponentWithStore(
      <Table
        attributionsWithResources={testAttributionsWithResources}
        onIconClick={doNothing}
        isFileWithChildren={(path: string): boolean =>
          path === '/file/with/children'
        }
      />
    );

    expect(screen.getByText('Name'));
    expect(screen.getByText('License'));

    expect(screen.getByText('Version'));
    expect(screen.getByText('1.0'));

    expect(screen.getAllByText('Name').length).toBe(1);
    expect(screen.getByText('React'));
    expect(screen.getByText('licenseName'));

    expect(screen.getByText('Copyright'));
    expect(screen.getByText('test copyright'));

    expect(screen.getByText('License Text'));
    expect(screen.getByText('licenseText'));

    expect(screen.getByText('Confidence'));
    expect(screen.getByText('20'));

    expect(screen.getByText('Comment'));
    expect(screen.getByText('test comment'));

    expect(screen.getByText('URL'));
    expect(screen.getByText('packageWebsite'));

    expect(screen.getByText('First Party'));
    expect(screen.getByText('Yes'));

    expect(screen.getByText('Follow-up'));
    expect(screen.getAllByText('No'));

    expect(screen.getByText('Resources'));
    expect(screen.getByText('/'));

    expect(screen.getByText('Redux'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.getByLabelText('Comment icon'));
  });
});
