// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import * as MockDate from 'mockdate';

import { Criticality } from '../../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../../shared/write-file';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { saveFile } from '../saveFile';

vi.mock('../../../shared/write-file', async () => ({
  ...(await vi.importActual('../../../shared/write-file')),
  writeFile: vi.fn(),
  writeOpossumFile: vi.fn(),
}));

const mockDate = 1603976726737;
MockDate.set(new Date(mockDate));

describe('saveFile', () => {
  it('writes to attributionFilePath as JSON for legacy format', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/resource']),
      manualAttributions: {
        attributions: {
          uuid1: {
            id: 'uuid1',
            packageName: 'my-package',
            packageVersion: '1.0.0',
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: { '/resource': ['uuid1'] },
        attributionsToResources: { uuid1: ['/resource'] },
      },
      externalAttributions: {
        attributions: {
          ext1: { id: 'ext1', criticality: Criticality.None },
        },
        resourcesToAttributions: {},
        attributionsToResources: {},
      },
      resolvedExternalAttributions: new Set(['ext1']),
    });

    await saveFile(
      {
        projectId: 'project-1',
        attributionFilePath: '/output/attributions.json',
      },
      new Uint8Array(),
    );

    expect(writeFile).toHaveBeenCalledWith({
      path: '/output/attributions.json',
      content: expect.objectContaining({
        metadata: expect.objectContaining({
          projectId: 'project-1',
          fileCreationDate: `${mockDate}`,
        }),
        manualAttributions: {
          uuid1: expect.objectContaining({
            packageName: 'my-package',
            packageVersion: '1.0.0',
          }),
        },
        resourcesToAttributions: { '/resource': ['uuid1'] },
        resolvedExternalAttributions: ['ext1'],
      }),
    });
    expect(writeOpossumFile).not.toHaveBeenCalled();
  });

  it('writes to opossumFilePath as .opossum format', async () => {
    const inputFileRaw = new Uint8Array([1, 2, 3]);

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

    await saveFile(
      {
        projectId: 'project-2',
        opossumFilePath: '/output/file.opossum',
      },
      inputFileRaw,
    );

    expect(writeOpossumFile).toHaveBeenCalledWith({
      path: '/output/file.opossum',
      input: inputFileRaw,
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
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('throws when no output file path is configured', async () => {
    await initializeDbWithTestData();

    await expect(
      saveFile({ projectId: 'project-4' }, new Uint8Array()),
    ).rejects.toThrow('No output file path configured');
  });
});
