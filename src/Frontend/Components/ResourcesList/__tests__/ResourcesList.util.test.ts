// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ResourcesListBatch } from '../../../types/types';
import { ResourcesListItem } from '../ResourcesList';
import { convertResourcesListBatchesToResourcesListItems } from '../ResourcesList.util';

describe('convertResourceListBatchesToResourceListItems', () => {
  it('inserts headers correctly', () => {
    const resourcesListBatches: Array<ResourcesListBatch> = [
      { resourceIds: ['resource_1'] },
      {
        resourceIds: ['resource_2', 'resource_3'],
      },
    ];

    const expectedResourcesListItems: Array<ResourcesListItem> = [
      { text: 'resource_1' },
      { text: 'resource_2' },
      { text: 'resource_3' },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual(expectedResourcesListItems);
  });

  it('executes case insensitive sort on resourceIds of each batch', () => {
    const resourcesListBatches: Array<ResourcesListBatch> = [
      { resourceIds: ['README.md', 'package.json'] },
      {
        resourceIds: ['resource_3', 'resource_2'],
      },
    ];

    const expectedResourcesListItems: Array<ResourcesListItem> = [
      { text: 'README.md' },
      { text: 'package.json' },
      { text: 'resource_3' },
      { text: 'resource_2' },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual(expectedResourcesListItems);
  });
});
