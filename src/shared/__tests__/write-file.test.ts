// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { strFromU8, unzipSync } from 'fflate';
import fs from 'fs';
import path from 'path';

import { writeFile, writeOpossumFile } from '../write-file';
import { INPUT_FILE_NAME, OUTPUT_FILE_NAME } from '../write-file-utils';

describe('writeFile', () => {
  it('creates parent directories before writing plain files', async () => {
    const filePath = path.join(
      'test-output',
      crypto.randomUUID(),
      'nested',
      'input.json',
    );

    await writeFile({
      path: filePath,
      content: { projectId: 'project-1' },
    });

    expect(fs.existsSync(filePath)).toBe(true);
    expect(JSON.parse(await fs.promises.readFile(filePath, 'utf8'))).toEqual({
      projectId: 'project-1',
    });
  });
});

describe('writeOpossumFile', () => {
  it('creates parent directories before writing opossum archives', async () => {
    const filePath = path.join(
      'test-output',
      crypto.randomUUID(),
      'nested',
      'project.opossum',
    );
    const input = { metadata: { projectId: 'project-1' } };
    const output = { metadata: { projectId: 'project-1' } };

    await writeOpossumFile({ path: filePath, input, output });

    expect(fs.existsSync(filePath)).toBe(true);

    const archive = unzipSync(
      new Uint8Array(await fs.promises.readFile(filePath)),
    );
    expect(JSON.parse(strFromU8(archive[INPUT_FILE_NAME]))).toEqual(input);
    expect(JSON.parse(strFromU8(archive[OUTPUT_FILE_NAME]))).toEqual(output);
  });
});
