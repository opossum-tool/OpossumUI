// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ResourcesListBatch } from '../../types/types';
import { ResourcesListItem } from './ResourcesList';

export function convertResourcesListBatchesToResourcesListItems(
  resourcesListBatches: Array<ResourcesListBatch>,
): Array<ResourcesListItem> {
  const resourcesListItems: Array<ResourcesListItem> = [];

  resourcesListBatches.sort().forEach((resourcesListBatch) => {
    resourcesListBatch.resourceIds.forEach((resourceId) => {
      resourcesListItems.push({
        text: resourceId,
      });
    });
  });
  return resourcesListItems;
}
