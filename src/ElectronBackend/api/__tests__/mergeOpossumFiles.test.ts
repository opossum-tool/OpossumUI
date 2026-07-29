// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import { mergeOpossumArchives } from '../../split/merge-opossum-files';
import { mergeOpossumFiles } from '../mergeOpossumFiles';
import { saveFile } from '../saveFile';

vi.mock('../saveFile', () => ({ saveFile: vi.fn() }));
vi.mock('../../split/merge-opossum-files', () => ({
  mergeOpossumArchives: vi.fn(),
}));

describe('mergeOpossumFiles', () => {
  it('saves the open project before merging it with the selected partitions', async () => {
    const opossumZip = new AdmZip();
    const saveFileParams = {
      opossumFilePath: '/partitions/open.opossum',
      projectId: 'project-id',
    };

    await mergeOpossumFiles(
      {
        saveFileParams,
        partitionPaths: ['/partitions/docs.opossum'],
      },
      opossumZip,
    );

    expect(saveFile).toHaveBeenCalledWith(saveFileParams, opossumZip);
    expect(mergeOpossumArchives).toHaveBeenCalledWith({
      inputPaths: ['/partitions/open.opossum', '/partitions/docs.opossum'],
      outputPath: '/partitions/open.opossum',
    });
  });
});
