// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { dirname } from 'path';
import { env } from 'process';
import { pipeline } from 'stream';

const EXECUTE_PERMISSIONS = 0o755;

async function downloadOpossumFile() {
  const osSuffix = process.argv[2];

  if (!osSuffix) {
    console.error(
      'Please specify one of the following options: mac, ubuntu, windows.exe',
    );
    process.exit(1);
  }

  const destinationPath = 'bin/opossum-file';
  const opossumFileBinaryName = `opossum-file-for-${osSuffix}`;

  const folder = dirname(destinationPath);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  } else if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath);
  }

  const githubToken = env.GITHUB_TOKEN;

  if (!githubToken) {
    console.warn(
      'No GitHub token is provided. The download will be rate-limited.',
    );
  }

  const requestParams = !env.GITHUB_TOKEN
    ? undefined
    : {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        },
      };

  const latestReleaseResponse = await fetch(
    'https://api.github.com/repos/opossum-tool/opossum-file/releases/latest',
    requestParams,
  );
  const latestRelease = await latestReleaseResponse.json();

  if (!latestReleaseResponse.ok) {
    throw new Error(latestRelease.message ?? 'Failed to fetch latest release');
  }

  const downloadResponse = await fetch(
    `https://github.com/opossum-tool/opossum-file/releases/download/${latestRelease.tag_name}/${opossumFileBinaryName}`,
    requestParams,
  );

  if (!downloadResponse.ok) {
    throw new Error(
      downloadResponse.message ?? 'Failed to download the binary',
    );
  }

  await new Promise((resolve, reject) => {
    pipeline(
      downloadResponse.body,
      fs.createWriteStream(destinationPath),
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });

  await fs.promises.chmod(destinationPath, EXECUTE_PERMISSIONS);
}

await downloadOpossumFile();
