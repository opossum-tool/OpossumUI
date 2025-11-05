// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import path from 'path';

import { OPOSSUM_FILE_EXTENSION } from '../../shared/write-file-utils';

export function isOpossumFileFormat(filePath?: string): boolean {
  if (!filePath) {
    return false;
  }
  return path.extname(filePath) === OPOSSUM_FILE_EXTENSION;
}
