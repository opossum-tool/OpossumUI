// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from './helpers/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickFilterMenuButton,
  closeFilterMenu,
  gotoResource,
} from './helpers/ui';

const [folderName, deferredFileName, plainFileName, aiFileName] =
  faker.opossum.resourceNames({ count: 4 });
const [deferredId1, deferred1] = faker.opossum.rawAttribution({
  aiAttributions: { deferredFields: { copyright: true } },
});
const [deferredId2, deferred2] = faker.opossum.rawAttribution({
  aiAttributions: { deferredFields: { copyright: true } },
});
const [plainId, plain] = faker.opossum.rawAttribution();
const [aiId, ai] = faker.opossum.rawAttribution({
  aiAttributions: { humanModified: false },
});

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [folderName]: { [deferredFileName]: 1 },
    [plainFileName]: 1,
    [aiFileName]: 1,
  }),
  manualAttributions: deserializeAttributions({
    [deferredId1]: deferred1,
    [deferredId2]: deferred2,
    [plainId]: plain,
    [aiId]: ai,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(folderName, deferredFileName)]: [deferredId1],
    [faker.opossum.filePath(plainFileName)]: [plainId],
    [faker.opossum.filePath(aiFileName)]: [aiId],
    [faker.opossum.folderPath(folderName)]: [deferredId2],
  }),
});

describe('scratch: relation tabs vs filter count', () => {
  it('dumps tabs and filter count for a writable selection', async () => {
    await renderApp({ data });
    await gotoResource(folderName, deferredFileName);

    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['EXPECTED-TO-FAIL-SO-WE-SEE-TABS', tabs]);

    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
    const item = screen.getByRole('menuitem', {
      name: new RegExp(`^${text.filters.aiDeferred}`),
    });
    expect(item.textContent).toBe('LABEL');
    await closeFilterMenu();
  });
});
