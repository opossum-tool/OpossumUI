// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import nunjucks from 'nunjucks';
import { join } from 'path';

function generateNotices() {
  const noticeDocumentFolder = join(import.meta.dirname, '..', 'notices');
  const generatedNoticeContent = readFileSync(
    join(noticeDocumentFolder, 'notices.txt'),
    'utf8',
  );
  const manualNoticesContent = readFileSync(
    join(import.meta.dirname, 'manual-notices.txt'),
    'utf8',
  );

  const noticeContent = `${generatedNoticeContent}\n\n-----\n\n${manualNoticesContent}`;

  copyFileSync(
    join(
      import.meta.dirname,
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
    nunjucks.render(join(import.meta.dirname, 'notices.template.html'), {
      noticeContent,
    }),
  );
}

generateNotices();
