// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { AttributionsViewPackageList } from '../AttributionsViewPackageList';
import { DisplayPackageInfos } from '../../../types/types';

describe('The AttributionsViewPackageList', () => {
  it('has search functionality', () => {
    const testSortedPackageCardIds = [
      'packageCardId1',
      'packageCardId2',
      'packageCardId3',
    ];
    const testDisplayPackageInfos: DisplayPackageInfos = {
      [testSortedPackageCardIds[0]]: {
        packageName: 'name 1',
        licenseText: 'text',
        licenseName: 'license name 2',
        comments: ['comment bla'],
        packageVersion: '1.1.1',
        attributionIds: ['uuid_1'],
      },
      [testSortedPackageCardIds[1]]: {
        packageName: 'name 2',
        copyright: '(c)',
        comments: ['comment blub'],
        url: 'www.url.de',
        attributionIds: ['uuid_2'],
      },
      [testSortedPackageCardIds[2]]: {
        packageVersion: 'packageVersion',
        attributionIds: ['uuid_3'],
      },
    };

    renderComponentWithStore(
      <AttributionsViewPackageList
        displayPackageInfos={testDisplayPackageInfos}
        sortedPackageCardIds={testSortedPackageCardIds}
        getAttributionCard={(packageCardId): ReactElement => (
          <div>{packageCardId}</div>
        )}
        max={{ numberOfDisplayedItems: 20 }}
      />,
    );
    screen.getByText(testSortedPackageCardIds[0]);
    screen.getByText(testSortedPackageCardIds[1]);
    screen.getByText(testSortedPackageCardIds[2]);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'name 1' },
    });
    screen.getByText(testSortedPackageCardIds[0]);
    expect(
      screen.queryByText(testSortedPackageCardIds[1]),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(testSortedPackageCardIds[2]),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'name' },
    });
    screen.getByText(testSortedPackageCardIds[0]);
    screen.getByText(testSortedPackageCardIds[1]);
    expect(
      screen.queryByText(testSortedPackageCardIds[2]),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '(C)' },
    });
    expect(
      screen.queryByText(testSortedPackageCardIds[0]),
    ).not.toBeInTheDocument();
    screen.getByText(testSortedPackageCardIds[1]);
    expect(
      screen.queryByText(testSortedPackageCardIds[2]),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'NAME 2' },
    });
    screen.getByText(testSortedPackageCardIds[0]);
    screen.getByText(testSortedPackageCardIds[1]);
    expect(
      screen.queryByText(testSortedPackageCardIds[2]),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'comment' },
    });
    expect(
      screen.queryByText(testSortedPackageCardIds[0]),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(testSortedPackageCardIds[1]),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(testSortedPackageCardIds[2]),
    ).not.toBeInTheDocument();
  });
});
