// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from 'fs';
import { uniqueId } from 'lodash';
import { tmpdir } from 'os';
import { join } from 'path';

import { parseOpossumFile } from '../../input/parseFile';
import { isOpossumFileFormat } from '../../utils/isOpossumFileFormat';
import {
  convertOwaspToOpossum,
  convertScancodeToOpossum,
} from '../convertToOpossum';

describe('conversion to opossum', () => {
  const SCANCODE_TEST_FILE = join(__dirname, 'scancode.json');
  const OWASP_TEST_FILE = join(__dirname, 'owasp-dependency-check-report.json');

  it('should convert the ScanCode file and return a path to a valid .opossum file', async () => {
    const opossumPath = join(tmpdir(), `${uniqueId('opossum_')}.opossum`);
    await convertScancodeToOpossum(SCANCODE_TEST_FILE, opossumPath);
    expect(existsSync(opossumPath)).toBe(true);
    expect(isOpossumFileFormat(opossumPath)).toBe(true);

    const parsingResult = await parseOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  });

  it('should convert the owasp file and return a path to a valid .opossum file', async () => {
    const opossumPath = join(tmpdir(), `${uniqueId('opossum_')}.opossum`);
    await convertOwaspToOpossum(OWASP_TEST_FILE, opossumPath);
    expect(existsSync(opossumPath)).toBe(true);
    expect(isOpossumFileFormat(opossumPath)).toBe(true);

    const parsingResult = await parseOpossumFile(opossumPath);
    expect(parsingResult).toHaveProperty('input');
  });
});
