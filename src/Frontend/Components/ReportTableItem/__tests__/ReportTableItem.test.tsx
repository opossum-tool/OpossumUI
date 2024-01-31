// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
} from '../../../../shared/shared-types';
import { renderComponent } from '../../../test-helpers/render';
import { doNothing } from '../../../util/do-nothing';
import { ReportTableItem } from '../ReportTableItem';

describe('The ReportTableItem', () => {
  it('renders', () => {
    const testAttributionsWithResources: Attributions = {
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
        id: 'uuid1',
      },
    };
    renderComponent(
      <ReportTableItem
        attributionId={'uuid1'}
        attributionInfo={testAttributionsWithResources['uuid1']}
        onIconClick={doNothing}
        isFileWithChildren={(path: string): boolean =>
          path === '/file/with/children'
        }
      />,
    );
    expect(screen.getByText('1.0')).toBeInTheDocument();

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('licenseName')).toBeInTheDocument();

    expect(screen.getByText('test copyright')).toBeInTheDocument();

    expect(screen.getByText('licenseText')).toBeInTheDocument();

    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('test comment')).toBeInTheDocument();

    expect(screen.getByText('packageWebsite')).toBeInTheDocument();
  });

  it('renders icons correctly', () => {
    const testAttributionsWithResources: Attributions = {
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
        needsReview: true,
        preferred: true,
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: [],
        followUp: true,
        excludeFromNotice: true,
        id: 'uuid2',
      },
    };
    renderComponent(
      <>
        <ReportTableItem
          attributionId={'uuid1'}
          attributionInfo={testAttributionsWithResources['uuid1']}
          onIconClick={doNothing}
          isFileWithChildren={(path: string): boolean =>
            path === '/file/with/children'
          }
        />
        <ReportTableItem
          attributionId={'uuid2'}
          attributionInfo={testAttributionsWithResources['uuid2']}
          onIconClick={doNothing}
          isFileWithChildren={(path: string): boolean =>
            path === '/file/with/children'
          }
        />
      </>,
    );

    expect(screen.getByLabelText('Comment icon')).toBeInTheDocument();
    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Exclude from notice icon'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Needs-review icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred icon')).toBeInTheDocument();
  });
});
