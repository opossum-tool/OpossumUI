// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionsWithResources } from '../../../../shared/shared-types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { doNothing } from '../../../util/do-nothing';
import { screen } from '@testing-library/react';
import React from 'react';
import { ReportTableItem } from '../ReportTableItem';
import { DiscreteConfidence } from '../../../enums/enums';

describe('The ReportTableItem', () => {
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
    };
    renderComponentWithStore(
      <ReportTableItem
        attributionId={'uuid1'}
        attributionInfo={testAttributionsWithResources['uuid1']}
        onIconClick={doNothing}
        isFileWithChildren={(path: string): boolean =>
          path === '/file/with/children'
        }
      />
    );
    expect(screen.getByText('1.0'));

    expect(screen.getByText('React'));
    expect(screen.getByText('licenseName'));

    expect(screen.getByText('test copyright'));

    expect(screen.getByText('licenseText'));

    expect(screen.getByText('20'));

    expect(screen.getByText('test comment'));

    expect(screen.getByText('packageWebsite'));

    expect(screen.getByText('Yes'));

    expect(screen.getAllByText('No')).toHaveLength(2);

    expect(screen.getByText('/'));
  });

  test('renders icons correctly', () => {
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
        followUp: 'FOLLOW_UP',
        excludeFromNotice: true,
      },
    };
    renderComponentWithStore(
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
      </>
    );

    expect(screen.getByLabelText('Comment icon'));
    expect(screen.getByLabelText('First party icon'));
    expect(screen.getByLabelText('Follow-up icon'));
    expect(screen.getByLabelText('Exclude from notice icon'));
  });
});
