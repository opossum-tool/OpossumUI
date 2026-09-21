// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const upperFolder = '/00-expandable/';
const selectedResource = '/99-selected';
const childNames = Array.from(
  { length: 4 },
  (_, index) => `child-${index.toString().padStart(2, '0')}`,
);
const childResources = childNames.map(
  (childName) => `${upperFolder}${childName}`,
);
const lowerResources = Object.fromEntries(
  Array.from(
    { length: 98 },
    (_, index) => [`${index.toString().padStart(2, '0')}-selected`, 1] as const,
  ),
);

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: {
        '00-expandable': Object.fromEntries(
          childNames.map((childName) => [childName, 1]),
        ),
        ...lowerResources,
        '99-selected': 1,
      },
    }),
  },
});

test('preserves the selected resource viewport when expanding an upper folder', async ({
  resourcesTree,
}) => {
  await resourcesTree.scrollToBottom();
  await resourcesTree.clickResource('99-selected');
  await resourcesTree.assert.resourceAtPathIsSelected(selectedResource);

  await resourcesTree.scrollToTop();
  await resourcesTree.assert.resourceAtPathIsInViewport(upperFolder);
  await resourcesTree.assert.resourceAtPathIsNotInViewport(selectedResource);
  await resourcesTree.expandResource(upperFolder);

  await resourcesTree.assert.resourceAtPathIsInViewport(upperFolder);
  for (const childResource of childResources) {
    await resourcesTree.assert.resourceAtPathIsInViewport(childResource);
  }
  await resourcesTree.assert.resourceAtPathIsNotInViewport(selectedResource);
  await resourcesTree.assert.resourceAtPathIsSelected(selectedResource);
});
