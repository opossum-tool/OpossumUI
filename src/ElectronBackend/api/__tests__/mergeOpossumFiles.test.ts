// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import {
  mergeOpossumArchives,
  ReadonlyResourceOutputConflictError,
} from '../../split/merge-opossum-files';
import {
  mergeOpossumFiles,
  mergeOpossumFilesFromPaths,
} from '../mergeOpossumFiles';
import { saveFile } from '../saveFile';

vi.mock('../saveFile', () => ({ saveFile: vi.fn() }));
vi.mock('../../split/merge-opossum-files', async (importOriginal) => ({
  ...(await importOriginal()),
  mergeOpossumArchives: vi.fn(),
}));

describe('mergeOpossumFiles', () => {
  it('saves the open project before merging it with the selected partitions', async () => {
    const opossumZip = new AdmZip();
    const saveFileParams = {
      opossumFilePath: '/partitions/open.opossum',
      projectId: 'project-id',
    };

    await expect(
      mergeOpossumFiles(
        {
          ignoreReadonlyResourceOutputConflicts: true,
          saveFileParams,
          partitionPaths: ['/partitions/docs.opossum'],
        },
        opossumZip,
      ),
    ).resolves.toEqual({ status: 'success' });

    expect(saveFile).toHaveBeenCalledWith(saveFileParams, opossumZip);
    expect(mergeOpossumArchives).toHaveBeenCalledWith({
      ignoreReadonlyResourceOutputConflicts: true,
      inputPaths: ['/partitions/open.opossum', '/partitions/docs.opossum'],
      outputPath: '/partitions/open.opossum',
    });
  });

  it('returns a readonly conflict result', async () => {
    vi.mocked(mergeOpossumArchives).mockRejectedValue(
      new ReadonlyResourceOutputConflictError('Readonly output conflict'),
    );

    await expect(
      mergeOpossumFilesFromPaths({
        ignoreReadonlyResourceOutputConflicts: false,
        inputPaths: ['/partitions/docs.opossum'],
        outputPath: '/merged/project.opossum',
      }),
    ).resolves.toEqual({
      errorType: 'readonly-resource-output-conflict',
      status: 'error',
    });
  });

  it('returns an unknown error result for other merge failures', async () => {
    vi.mocked(mergeOpossumArchives).mockRejectedValue(
      new Error('Output directory does not exist'),
    );

    await expect(
      mergeOpossumFilesFromPaths({
        ignoreReadonlyResourceOutputConflicts: false,
        inputPaths: ['/partitions/docs.opossum'],
        outputPath: '/merged/project.opossum',
      }),
    ).resolves.toEqual({
      errorMessage: 'Output directory does not exist',
      errorType: 'unknown',
      status: 'error',
    });
  });

  it('returns an unknown error result when saving the current project fails', async () => {
    vi.mocked(saveFile).mockRejectedValue(new Error('Unable to save file'));

    await expect(
      mergeOpossumFiles(
        {
          ignoreReadonlyResourceOutputConflicts: false,
          saveFileParams: {
            opossumFilePath: '/partitions/open.opossum',
            projectId: 'project-id',
          },
          partitionPaths: ['/partitions/docs.opossum'],
        },
        new AdmZip(),
      ),
    ).resolves.toEqual({
      errorMessage: 'Unable to save file',
      errorType: 'unknown',
      status: 'error',
    });
  });
});
