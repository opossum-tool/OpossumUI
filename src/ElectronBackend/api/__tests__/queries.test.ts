// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ParsedFileContent } from '../../../shared/shared-types';
import { initializeDb } from '../../db/initializeDb';
import { queries } from '../queries';

const TEST_FILE_CONTENT: ParsedFileContent = {
  metadata: { projectId: '', fileCreationDate: '' },
  resources: { src: { 'App.tsx': 1, utils: { 'helper.ts': 1 } } },
  config: { classifications: {} },
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
  },
  externalAttributions: {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
  },
  frequentLicenses: { nameOrder: [], texts: {} },
  resolvedExternalAttributions: new Set(),
  attributionBreakpoints: new Set(),
  filesWithChildren: new Set(),
  baseUrlsForSources: {},
  externalAttributionSources: {},
};

describe('searchResources', () => {
  beforeEach(async () => {
    await initializeDb(TEST_FILE_CONTENT);
  });

  it('finds resources matching search string case-insensitively', async () => {
    const results = await queries.searchResources({ searchString: 'APP' });

    expect(results.result).toEqual(['/src/App.tsx']);
  });

  it('appends trailing slash to directories', async () => {
    const results = await queries.searchResources({ searchString: 'src' });

    expect(results.result).toContain('/src/');
  });
});
