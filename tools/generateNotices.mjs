// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import nunjucks from 'nunjucks';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateNotices() {
  const noticeDocumentFolder = join(__dirname, '..', 'notices');
  const generatedNoticeContent = readFileSync(
    join(noticeDocumentFolder, 'notices.txt'),
    'utf8',
  );
  const manualNoticesContent = readFileSync(
    join(__dirname, 'manual-notices.txt'),
    'utf8',
  );

  const noticeContent = `${generatedNoticeContent}\n\n-----\n\n${manualNoticesContent}`;

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
      noticeContent,
    }),
  );
}

generateNotices();
