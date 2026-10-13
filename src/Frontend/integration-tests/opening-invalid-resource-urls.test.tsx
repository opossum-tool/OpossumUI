// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it, vi } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickPathBarOpenResourceUrl,
  closeErrorPopup,
  expectErrorPopupVisibility,
  expectPathBarCrumbs,
  expectPathBarOpenResourceUrlButtonEnabled,
  expectPopupHasText,
  gotoResource,
} from './helpers/ui';

const [resourceName1, resourceName2, resourceName3] =
  faker.opossum.resourceNames({ count: 3 });
const [attributionId, packageInfo] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: {
      [resourceName3]: 1,
    },
    [resourceName2]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [attributionId]: packageInfo,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName2)]: [attributionId],
  }),
  baseUrlsForSources: {
    [faker.opossum.folderPath(resourceName1)]: 'invalid/link',
  },
});

describe('opening invalid resource urls', () => {
  it('displays an error if user attempts to open invalid resource url', async () => {
    vi.spyOn(window.electronAPI, 'openLink').mockResolvedValue(
      new Error('Link error'),
    );

    await renderApp({ data });
    await gotoResource(resourceName1, resourceName3);
    await expectPathBarCrumbs([resourceName1, resourceName3]);
    await expectPathBarOpenResourceUrlButtonEnabled(true);

    await clickPathBarOpenResourceUrl();
    await expectErrorPopupVisibility(true);
    await expectPopupHasText('error popup', 'Cannot open link.');

    await closeErrorPopup();
    await expectErrorPopupVisibility(false);

    await gotoResource(resourceName2);
    await expectPathBarOpenResourceUrlButtonEnabled(false);
  });
});
