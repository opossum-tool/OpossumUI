// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ResourcesListBatch, ResourcesListItem } from '../../types/types';

export function convertResourcesListBatchesToResourcesListItems(
  resourcesListBatches: Array<ResourcesListBatch>
): Array<ResourcesListItem> {
  const resourcesListItems: Array<ResourcesListItem> = [];
  resourcesListBatches.forEach((resourcesListBatch) => {
    if (resourcesListBatch.header) {
      if (resourcesListItems.length > 0) {
        resourcesListItems.push({ text: '', isHeader: true });
      }
      resourcesListItems.push({
        text: resourcesListBatch.header,
        isHeader: true,
      });
    }
    resourcesListBatch.resourceIds.forEach((resourceId) => {
      resourcesListItems.push({
        text: resourceId,
      });
    });
  });
  return resourcesListItems;
}
