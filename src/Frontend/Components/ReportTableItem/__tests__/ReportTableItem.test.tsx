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
      <table>
        <tbody>
          <tr>
            <ReportTableItem
              packageInfo={testAttributionsWithResources['uuid1']}
            />
          </tr>
        </tbody>
      </table>,
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
      <table>
        <tbody>
          <tr>
            <ReportTableItem
              packageInfo={testAttributionsWithResources['uuid1']}
            />
            <ReportTableItem
              packageInfo={testAttributionsWithResources['uuid2']}
            />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Exclude from notice icon'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Needs-review icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred icon')).toBeInTheDocument();
  });
});
