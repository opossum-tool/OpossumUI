// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  AttributionsWithResources,
  DiscreteConfidence,
} from '../../../../shared/shared-types';
import { renderComponent } from '../../../test-helpers/render';
import { doNothing } from '../../../util/do-nothing';
import { Table } from '../Table';

describe('The Table', () => {
  it('renders', () => {
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
    renderComponent(
      <Table
        attributionsWithResources={testAttributionsWithResources}
        onIconClick={doNothing}
        isFileWithChildren={(path: string): boolean =>
          path === '/file/with/children'
        }
      />,
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();

    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();

    expect(screen.getAllByText('Name')).toHaveLength(1);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('licenseName')).toBeInTheDocument();

    expect(screen.getByText('Copyright')).toBeInTheDocument();
    expect(screen.getByText('test copyright')).toBeInTheDocument();

    expect(screen.getByText('License Text')).toBeInTheDocument();
    expect(screen.getByText('licenseText')).toBeInTheDocument();

    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('Comment')).toBeInTheDocument();
    expect(screen.getByText('test comment')).toBeInTheDocument();

    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('packageWebsite')).toBeInTheDocument();

    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();

    expect(screen.getByText('Redux')).toBeInTheDocument();
    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Comment icon')).toBeInTheDocument();
  });
});
