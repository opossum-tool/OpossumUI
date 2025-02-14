// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from 'fs';
import { uniqueId } from 'lodash';
import { tmpdir } from 'os';
import { join } from 'path';

import { FileType } from '../../../shared/shared-types';
import { parseOpossumFile } from '../../input/parseFile';
import { isOpossumFileFormat } from '../../utils/isOpossumFileFormat';
import { convertToOpossum } from '../convertToOpossum';

describe('conversion to opossum', () => {
  const SCANCODE_TEST_FILE = join(__dirname, 'scancode.json');
  const OWASP_TEST_FILE = join(__dirname, 'owasp-dependency-check-report.json');

  it('should convert the ScanCode file and return a path to a valid .opossum file', async () => {
    const opossumPath = join(tmpdir(), `${uniqueId('opossum_')}.opossum`);
    await convertToOpossum(
      SCANCODE_TEST_FILE,
      opossumPath,
      FileType.SCANCODE_JSON,
    );
    expect(existsSync(opossumPath)).toBe(true);
    expect(isOpossumFileFormat(opossumPath)).toBe(true);

    const parsingResult = await parseOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  });

  it('should convert the owasp file and return a path to a valid .opossum file', async () => {
    const opossumPath = join(tmpdir(), `${uniqueId('opossum_')}.opossum`);
    await convertToOpossum(OWASP_TEST_FILE, opossumPath, FileType.OWASP_JSON);
    expect(existsSync(opossumPath)).toBe(true);
    expect(isOpossumFileFormat(opossumPath)).toBe(true);

    const parsingResult = await parseOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  });
});
