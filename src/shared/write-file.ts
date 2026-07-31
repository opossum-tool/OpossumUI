// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import type { ReadonlyRule } from './shared-types';
import {
  INPUT_FILE_NAME,
  OUTPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from './write-file-utils';

export async function writeOpossumFile({
  input,
  output,
  path,
  readonlyRules,
  zip,
}: {
  input?: string | Uint8Array | object;
  output?: string | Uint8Array | object;
  path: string;
  readonlyRules?: Array<ReadonlyRule>;
  zip?: AdmZip;
}): Promise<string> {
  if (zip) {
    if (output) {
      if (zip.getEntry(OUTPUT_FILE_NAME)) {
        zip.updateFile(OUTPUT_FILE_NAME, toBuffer(output));
      } else {
        zip.addFile(OUTPUT_FILE_NAME, toBuffer(output));
      }
    }
  } else {
    zip = new AdmZip();
    if (input) {
      zip.addFile(INPUT_FILE_NAME, toBuffer(input));
    }
    if (output) {
      zip.addFile(OUTPUT_FILE_NAME, toBuffer(output));
    }
  }
  if (readonlyRules !== undefined) {
    updateReadonlyRules(zip, readonlyRules);
  }

  await zip.writeZipPromise(path);
  return path;
}

function updateReadonlyRules(
  zip: AdmZip,
  readonlyRules: Array<ReadonlyRule>,
): void {
  if (readonlyRules.length === 0) {
    zip.deleteFile(SPLIT_INFO_FILE_NAME);
  } else if (zip.getEntry(SPLIT_INFO_FILE_NAME)) {
    zip.updateFile(SPLIT_INFO_FILE_NAME, toBuffer({ readonlyRules }));
  } else {
    zip.addFile(SPLIT_INFO_FILE_NAME, toBuffer({ readonlyRules }));
  }
}

function toBuffer(content: string | Uint8Array | object): Buffer {
  if (Buffer.isBuffer(content)) {
    return content;
  }
  if (content instanceof Uint8Array) {
    return Buffer.from(content);
  }
  return Buffer.from(
    typeof content === 'string'
      ? content
      : JSON.stringify(content, (_, value) =>
          value instanceof Set ? [...value] : value,
        ),
  );
}
