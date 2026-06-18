// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import * as MockDate from 'mockdate';

import { Criticality } from '../../../shared/shared-types';
import { writeOpossumFile } from '../../../shared/write-file';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { buildOpossumOutputFile, persistOutputFile } from '../saveFile';

vi.mock('../../../shared/write-file', async () => ({
  ...(await vi.importActual('../../../shared/write-file')),
  writeOpossumFile: vi.fn(),
}));

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

describe('persistOutputFile', () => {
  it('writes to opossumFilePath as .opossum format', async () => {
    const opossumZip = new AdmZip();

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

    await persistOutputFile('project-2', '/output/file.opossum', opossumZip);

    expect(writeOpossumFile).toHaveBeenCalledWith({
      path: '/output/file.opossum',
      zip: opossumZip,
      output: expect.objectContaining({
        metadata: expect.objectContaining({
          projectId: 'project-2',
        }),
        manualAttributions: {
          uuid1: expect.objectContaining({
            packageName: 'opossum-pkg',
          }),
        },
        resourcesToAttributions: { '/a': ['uuid1'] },
      }),
    });
  });
});
