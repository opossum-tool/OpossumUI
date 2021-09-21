// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const nunjucks = require('nunjucks');
const path = require('path');

const noticeDocumentForChromium = path.join(
  __dirname,
  '..',
  'node_modules',
  'electron',
  'dist',
  'LICENSES.chromium.html'
);
const noticeDocumentForOpossumUITemplate = path.join(
  __dirname,
  'notices.template.html'
);
const noticeDocumentFolder = path.join(__dirname, '..', 'notices');
const noticeDocumentRaw = path.join(noticeDocumentFolder, 'notices.txt');

(() => {
  const fileContent = fs.readFileSync(noticeDocumentRaw);

  copyNoticeForChromiumFromNodeModules(
    noticeDocumentForChromium,
    path.join(noticeDocumentFolder, 'LICENSES.chromium.html')
  );
  createNoticeForOpossumUI(
    fileContent,
    noticeDocumentForOpossumUITemplate,
    path.join(noticeDocumentFolder, 'notices.html')
  );
})();

function copyNoticeForChromiumFromNodeModules(originPath, destinationPath) {
  fs.copyFileSync(originPath, destinationPath);
}

function createNoticeForOpossumUI(
  noticeContent,
  templateFile,
  destinationPath
) {
  const result = nunjucks.render(templateFile, {
    noticeContent,
  });

  fs.writeFileSync(destinationPath, result);
}
