// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { convertResourcesListBatchesToResourcesListItems } from '../resource-list-helpers';
import { ResourcesListItem } from '../ResourcesList';
import { ResourcesListBatch } from '../../../types/types';

describe('convertResourceListBatchesToResourceListItems', () => {
  test('inserts headers correctly', () => {
    const resourcesListBatches: Array<ResourcesListBatch> = [
      { resourceIds: ['resource_1'] },
      {
        resourceIds: ['resource_2', 'resource_3'],
        header: 'Resources in Other Folders',
      },
    ];

    const expectedResourcesListItems: Array<ResourcesListItem> = [
      { text: 'resource_1' },
      { text: '', isHeader: true },
      { text: 'Resources in Other Folders', isHeader: true },
      { text: 'resource_2' },
      { text: 'resource_3' },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual(expectedResourcesListItems);
  });

  test('executes case insensitive sort on resourceIds of each batch', () => {
    const resourcesListBatches: Array<ResourcesListBatch> = [
      { resourceIds: ['README.md', 'package.json'] },
      {
        resourceIds: ['resource_3', 'resource_2'],
        header: 'Resources in Other Folders',
      },
    ];

    const expectedResourcesListItems: Array<ResourcesListItem> = [
      { text: 'package.json' },
      { text: 'README.md' },
      { text: '', isHeader: true },
      { text: 'Resources in Other Folders', isHeader: true },
      { text: 'resource_2' },
      { text: 'resource_3' },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual(expectedResourcesListItems);
  });

  test('inserts no empty line for header at start of table', () => {
    const resourcesListBatches: Array<ResourcesListBatch> = [
      { resourceIds: ['resource_1'], header: 'Header' },
    ];

    const expectedResourcesListItems: Array<ResourcesListItem> = [
      { text: 'Header', isHeader: true },
      { text: 'resource_1' },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual(expectedResourcesListItems);
  });
});
