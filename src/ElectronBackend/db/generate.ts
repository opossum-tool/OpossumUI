// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import type { ParsedFileContent } from '../../shared/shared-types';
import { getDb } from './db';
import { generateDiagram } from './generateDiagram';
import { generateTypes } from './generateTypes';
import { initializeDb } from './initializeDb';

const directory = path.join(
  // @ts-expect-error Executed using tsx
  path.dirname(fileURLToPath(import.meta.url)),
  'generated',
);

const EMPTY_PARSED_FILE_CONTENT: ParsedFileContent = {
  metadata: { projectId: '', fileCreationDate: '' },
  resources: {},
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

async function main() {
  await fs.mkdir(directory, { recursive: true });
  await initializeDb(EMPTY_PARSED_FILE_CONTENT);
  const db = getDb();

  await generateTypes(db, path.join(directory, 'databaseTypes.ts'));
  await generateDiagram(db, path.join(directory, 'databaseDiagram.svg'));

  console.log('Generated types and diagram in', directory);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Error in generation script:', e);
    process.exit(1);
  });
