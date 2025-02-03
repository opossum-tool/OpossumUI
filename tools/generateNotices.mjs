// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import nunjucks from 'nunjucks';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateNotices() {
  const noticeDocumentFolder = join(__dirname, '..', 'notices');
  const fileContent = readFileSync(join(noticeDocumentFolder, 'notices.txt'));

  copyFileSync(
    join(
      __dirname,
      '..',
      'node_modules',
      'electron',
      'dist',
      'LICENSES.chromium.html',
    ),
    join(noticeDocumentFolder, 'LICENSES.chromium.html'),
  );
  writeFileSync(
    join(noticeDocumentFolder, 'notices.html'),
    nunjucks.render(join(__dirname, 'notices.template.html'), {
      fileContent,
    }),
  );
}

generateNotices();
