// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import userEvent from '@testing-library/user-event';
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  expectAttributionFormMatchesPackageInfo,
  expectResourceVisibility,
  gotoResource,
} from './helpers/ui';

const [resourceName1, resourceName2, resourceName3] =
  faker.opossum.resourceNames({ count: 3 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  packageName: 'c',
});

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: {
      [resourceName2]: 1,
    },
    [resourceName3]: 1,
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.folderPath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName2)]: [attributionId1],
    [faker.opossum.filePath(resourceName3)]: [attributionId3],
  }),
});

describe('selecting resources', () => {
  it('allows navigating up and down the resource tree by keyboard', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await gotoResource(resourceName2);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expectAttributionFormMatchesPackageInfo(packageInfo3);

    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{Enter}');
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
  });

  it('allows expanding and collapsing folders in the resource tree by keyboard', async () => {
    await renderApp({ data });
    await gotoResource(resourceName3);

    await userEvent.keyboard('{ArrowUp}');
    await expectResourceVisibility([], [resourceName2]);

    await userEvent.keyboard('{ArrowRight}');
    await expectResourceVisibility([resourceName2]);

    await userEvent.keyboard('{ArrowLeft}');
    await expectResourceVisibility([], [resourceName2]);

    await userEvent.keyboard('{Enter}');
    await expectResourceVisibility([resourceName2]);
  });
});
