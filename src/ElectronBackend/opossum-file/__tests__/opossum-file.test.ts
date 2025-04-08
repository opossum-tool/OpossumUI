// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { uniqueId } from 'lodash';
import { tmpdir } from 'os';
import { join } from 'path';

import { FileType } from '../../../shared/shared-types';
import { parseOpossumFile } from '../../input/parseFile';
import { ParsedOpossumInputAndOutput } from '../../types/types';
import { isOpossumFileFormat } from '../../utils/isOpossumFileFormat';
import { convertToOpossum, mergeFileIntoOpossum } from '../opossum-file';

const mockTmpdir = tmpdir();

jest.mock('electron', () => ({
  app: {
    getPath: () => mockTmpdir,
  },
}));

describe('conversion to opossum', () => {
  const SCANCODE_TEST_FILE = join(__dirname, 'scancode.json');
  const OWASP_TEST_FILE = join(__dirname, 'owasp-dependency-check-report.json');
  const LEGACY_OPOSSUM_TEST_FILE = join(__dirname, 'legacy.json');
  const OPOSSUM_TEST_FILE = join(__dirname, 'merge_base.opossum');
  const OPOSSUM_TEST_FILE_COPY = join(mockTmpdir, 'test_merge.opossum');

  it('converts the ScanCode file into a valid .opossum file', async () => {
    const opossumPath = join(mockTmpdir, `${uniqueId('opossum_')}.opossum`);
    await convertToOpossum(
      SCANCODE_TEST_FILE,
      opossumPath,
      FileType.SCANCODE_JSON,
    );
    expect(fs.existsSync(opossumPath)).toBe(true);
    expect(isOpossumFileFormat(opossumPath)).toBe(true);

    const parsingResult = await parseOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  }, 30000);

  it('converts the owasp file into a valid .opossum file', async () => {
    const opossumPath = join(mockTmpdir, `${uniqueId('opossum_')}.opossum`);
    await convertToOpossum(OWASP_TEST_FILE, opossumPath, FileType.OWASP_JSON);
    expect(fs.existsSync(opossumPath)).toBe(true);
    expect(isOpossumFileFormat(opossumPath)).toBe(true);

    const parsingResult = await parseOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  }, 30000);

  it('merges the legacy opossum file into an existing .opossum file', async () => {
    fs.copyFileSync(OPOSSUM_TEST_FILE, OPOSSUM_TEST_FILE_COPY);
    await mergeFileIntoOpossum(
      LEGACY_OPOSSUM_TEST_FILE,
      OPOSSUM_TEST_FILE_COPY,
      FileType.LEGACY_OPOSSUM,
    );
    const parsingResult = await parseOpossumFile(OPOSSUM_TEST_FILE_COPY);

    expect(parsingResult).toHaveProperty('input');
    expect(
      (parsingResult as ParsedOpossumInputAndOutput).input.resources[
        'index.tsx'
      ],
    ).toBeDefined();
    expect(
      (parsingResult as ParsedOpossumInputAndOutput).input.resources[
        'index.html'
      ],
    ).toBeDefined();
  }, 30000);

  it('merges the ScanCode file into an existing .opossum file', async () => {
    fs.copyFileSync(OPOSSUM_TEST_FILE, OPOSSUM_TEST_FILE_COPY);
    await mergeFileIntoOpossum(
      SCANCODE_TEST_FILE,
      OPOSSUM_TEST_FILE_COPY,
      FileType.SCANCODE_JSON,
    );
    const parsingResult = await parseOpossumFile(OPOSSUM_TEST_FILE_COPY);

    expect(parsingResult).toHaveProperty('input');
    expect(
      (parsingResult as ParsedOpossumInputAndOutput).input.resources[
        'index.tsx'
      ],
    ).toBeDefined();
    expect(
      (parsingResult as ParsedOpossumInputAndOutput).input.resources['src'],
    ).toBeDefined();
  }, 30000);

  it('merges the owasp file into an existing .opossum file', async () => {
    fs.copyFileSync(OPOSSUM_TEST_FILE, OPOSSUM_TEST_FILE_COPY);
    await mergeFileIntoOpossum(
      OWASP_TEST_FILE,
      OPOSSUM_TEST_FILE_COPY,
      FileType.OWASP_JSON,
    );
    const parsingResult = await parseOpossumFile(OPOSSUM_TEST_FILE_COPY);

    expect(parsingResult).toHaveProperty('input');
    expect(
      (parsingResult as ParsedOpossumInputAndOutput).input.resources[
        'index.tsx'
      ],
    ).toBeDefined();
    expect(
      (parsingResult as ParsedOpossumInputAndOutput).input.resources['contrib'],
    ).toBeDefined();
  }, 30000);
});
