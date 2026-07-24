// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import { faker } from '../../testing/Faker';
import { writeOpossumFile } from '../write-file';
import { INPUT_FILE_NAME, OUTPUT_FILE_NAME } from '../write-file-utils';

const input = { resource: 'input' };
const initialOutput = { attribution: 'initial' };
const updatedOutput = { attribution: 'updated' };

describe('writeOpossumFile', () => {
  it('adds output.json to an archive that does not have one', async () => {
    const opossumFilePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const zip = new AdmZip();
    zip.addFile(INPUT_FILE_NAME, Buffer.from(JSON.stringify(input)));

    await writeOpossumFile({
      path: opossumFilePath,
      zip,
      output: initialOutput,
    });

    const persistedZip = new AdmZip(opossumFilePath);
    expect(readJsonEntry(persistedZip, INPUT_FILE_NAME)).toEqual(input);
    expect(readJsonEntry(persistedZip, OUTPUT_FILE_NAME)).toEqual(
      initialOutput,
    );
  });

  it('updates an existing output.json without changing input.json', async () => {
    const opossumFilePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const zip = new AdmZip();
    zip.addFile(INPUT_FILE_NAME, Buffer.from(JSON.stringify(input)));
    zip.addFile(OUTPUT_FILE_NAME, Buffer.from(JSON.stringify(initialOutput)));

    await writeOpossumFile({
      path: opossumFilePath,
      zip,
      output: updatedOutput,
    });

    const persistedZip = new AdmZip(opossumFilePath);
    expect(readJsonEntry(persistedZip, INPUT_FILE_NAME)).toEqual(input);
    expect(readJsonEntry(persistedZip, OUTPUT_FILE_NAME)).toEqual(
      updatedOutput,
    );
  });
});

function readJsonEntry(zip: AdmZip, entryName: string): unknown {
  return JSON.parse(zip.readAsText(entryName)) as unknown;
}
