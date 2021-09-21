// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as fs from 'fs';
// @ts-ignore
import { cleanupTempDirs, createTempDirSync } from 'jest-fixtures';
import * as path from 'path';
import * as upath from 'upath';
import { OpossumOutputFile } from '../../types/types';
import { FollowUp } from '../../../shared/shared-types';
import { writeJsonToFile } from '../writeJsonToFile';

const attributions: OpossumOutputFile = {
  metadata: {
    projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
    fileCreationDate: '2',
  },
  manualAttributions: {
    uuid_1: {
      packageName: 'minimal attribution',
    },
    uuid_2: {
      packageName: 'full info attribution',
      packageVersion: '1.0',
      packageNamespace: 'org.apache.xmlgraphics',
      packagePURLAppendix:
        '?repository_url=repo.spring.io/release#everybody/loves/dogs',
      packageType: 'maven',
      firstParty: true,
      followUp: FollowUp,
      attributionConfidence: 100,
      comment: 'I found it!',
      url: 'https://www.theauthor.com/package',
      copyright: '(c) many people 1989',
      licenseName: 'MIT',
      licenseText: 'This is totally an MIT license!!111!',
      originId: '846f978e-8479-4b25-a010-63c1deac2e45',
    },
  },
  resourcesToAttributions: {
    mypath: ['uuid_1', 'uuid_2'],
  },
  resolvedExternalAttributions: [],
};

describe('writeJsonToFile', () => {
  afterEach(() => {
    cleanupTempDirs();
  });

  test('Test writeJsonToFile', () => {
    const temporaryPath: string = createTempDirSync();
    const jsonPath = path.join(upath.toUnix(temporaryPath), 'test.json');
    writeJsonToFile(jsonPath, attributions);

    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(content).toStrictEqual(attributions);
  });
});
