// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from 'fs';

import { parseOpossumFile } from '../../input/parseFile';
import { isOpossumFileFormat } from '../../utils/isOpossumFileFormat';
import { convertScanCodeToOpossum } from '../convertToOpossum';

describe('successfulConversionOfScanCodeFile', () => {
  const SCANCODE_TEST_FILE =
    'src/ElectronBackend/opossum-file/__tests__/scancode.json';

  it('should convert the ScanCode file and return a path to a valid .opossum file', async () => {
    const path = await convertScanCodeToOpossum(SCANCODE_TEST_FILE);
    expect(existsSync(path)).toBe(true);
    expect(isOpossumFileFormat(path)).toBe(true);

    const parsingResult = await parseOpossumFile(path);
    expect(parsingResult).toHaveProperty('input');
  });
});
