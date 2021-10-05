// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { convertResourcesListBatchesToResourcesListItems } from '../resource-list-helpers';

describe('convertResourceListBatchesToResourceListItems', () => {
  test('inserts headers correctly', () => {
    const resourcesListBatches = [
      { resourceIds: ['resource_1'] },
      {
        resourceIds: ['resource_2', 'resource_3'],
        header: 'Resources in Other Folders',
      },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual([
      { text: 'resource_1' },
      { text: '', isHeader: true },
      { text: 'Resources in Other Folders', isHeader: true },
      { text: 'resource_2' },
      { text: 'resource_3' },
    ]);
  });

  test('inserts no empty line for header at start of table', () => {
    const resourcesListBatches = [
      { resourceIds: ['resource_1'], header: 'Header' },
    ];

    const resourcesListItems =
      convertResourcesListBatchesToResourcesListItems(resourcesListBatches);

    expect(resourcesListItems).toStrictEqual([
      { text: 'Header', isHeader: true },
      { text: 'resource_1' },
    ]);
  });
});
