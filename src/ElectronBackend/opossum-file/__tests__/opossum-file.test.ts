// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { uniqueId } from 'lodash-es';
import { tmpdir } from 'os';
import { join } from 'path';

import { FileType } from '../../../shared/shared-types';
import { loadOpossumFile } from '../../input/parseFile';
import type { LoadedArchive } from '../../input/parseFile';
import { convertToOpossum, mergeFileIntoOpossum } from '../opossum-file';

const mockTmpdir = tmpdir();

vi.mock('electron', () => ({
  app: {
    getAppPath: () => process.cwd(),
    getPath: () => mockTmpdir,
    isPackaged: false,
  },
}));

describe('conversion to opossum', () => {
  const SCANCODE_TEST_FILE = join(__dirname, 'scancode.json');
  const OWASP_TEST_FILE = join(__dirname, 'owasp-dependency-check-report.json');
  const LEGACY_OPOSSUM_TEST_FILE = join(__dirname, 'legacy.json');
  const OPOSSUM_TEST_FILE = join(__dirname, 'merge_base.opossum');
  const LEGACY_OPOSSUM_TEST_FILE_COPY = join(
    mockTmpdir,
    'test_legacy_merge.opossum',
  );
  const SCANCODE_TEST_FILE_COPY = join(
    mockTmpdir,
    'test_scancode_merge.opossum',
  );
  const OWASP_TEST_FILE_COPY = join(mockTmpdir, 'test_owasp_merge.opossum');

  it('converts the ScanCode file into a valid .opossum file', async () => {
    const opossumPath = join(mockTmpdir, `${uniqueId('opossum_')}.opossum`);
    await convertToOpossum(
      SCANCODE_TEST_FILE,
      opossumPath,
      FileType.SCANCODE_JSON,
    );
    expect(fs.existsSync(opossumPath)).toBe(true);

    const parsingResult = await loadOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  }, 30000);

  it('converts the owasp file into a valid .opossum file', async () => {
    const opossumPath = join(mockTmpdir, `${uniqueId('opossum_')}.opossum`);
    await convertToOpossum(OWASP_TEST_FILE, opossumPath, FileType.OWASP_JSON);
    expect(fs.existsSync(opossumPath)).toBe(true);

    const parsingResult = await loadOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  }, 30000);

  it('merges the legacy opossum file into an existing .opossum file', async () => {
    fs.copyFileSync(OPOSSUM_TEST_FILE, LEGACY_OPOSSUM_TEST_FILE_COPY);
    await mergeFileIntoOpossum(
      LEGACY_OPOSSUM_TEST_FILE,
      LEGACY_OPOSSUM_TEST_FILE_COPY,
      FileType.LEGACY_OPOSSUM,
    );
    const parsingResult = await loadOpossumFile(LEGACY_OPOSSUM_TEST_FILE_COPY);

    expect(parsingResult).toHaveProperty('input');
    expect(
      (parsingResult as LoadedArchive).input.resources['index.tsx'],
    ).toBeDefined();
    expect(
      (parsingResult as LoadedArchive).input.resources['index.html'],
    ).toBeDefined();
  }, 30000);

  it('merges the ScanCode file into an existing .opossum file', async () => {
    fs.copyFileSync(OPOSSUM_TEST_FILE, SCANCODE_TEST_FILE_COPY);
    await mergeFileIntoOpossum(
      SCANCODE_TEST_FILE,
      SCANCODE_TEST_FILE_COPY,
      FileType.SCANCODE_JSON,
    );
    const parsingResult = await loadOpossumFile(SCANCODE_TEST_FILE_COPY);

    expect(parsingResult).toHaveProperty('input');
    expect(
      (parsingResult as LoadedArchive).input.resources['index.tsx'],
    ).toBeDefined();
    expect(
      (parsingResult as LoadedArchive).input.resources['src'],
    ).toBeDefined();
  }, 30000);

  it('merges the owasp file into an existing .opossum file', async () => {
    fs.copyFileSync(OPOSSUM_TEST_FILE, OWASP_TEST_FILE_COPY);
    await mergeFileIntoOpossum(
      OWASP_TEST_FILE,
      OWASP_TEST_FILE_COPY,
      FileType.OWASP_JSON,
    );
    const parsingResult = await loadOpossumFile(OWASP_TEST_FILE_COPY);

    expect(parsingResult).toHaveProperty('input');
    expect(
      (parsingResult as LoadedArchive).input.resources['index.tsx'],
    ).toBeDefined();
    expect(
      (parsingResult as LoadedArchive).input.resources['contrib'],
    ).toBeDefined();
  }, 30000);
});
