// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as MockDate from 'mockdate';

import { Criticality } from '../../../shared/shared-types';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { buildOpossumOutputFile } from '../saveFile';

const mockDate = 1603976726737;
MockDate.set(new Date(mockDate));

describe('buildOpossumOutputFile', () => {
  it('builds output file with correct structure', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/a']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            packageName: 'opossum-pkg',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: { '/a': ['uuid1'] },
        attributionsToResources: { uuid1: ['/a'] },
      },
    });

    const result = await buildOpossumOutputFile('project-1');

    expect(result).toEqual({
      metadata: {
        projectId: 'project-1',
        fileCreationDate: `${mockDate}`,
        inputFileMD5Checksum: undefined,
      },
      manualAttributions: {
        uuid1: expect.objectContaining({
          packageName: 'opossum-pkg',
        }),
      },
      resourcesToAttributions: { '/a': ['uuid1'] },
      resolvedExternalAttributions: [],
    });
  });
});
