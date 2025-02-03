// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { dirname } from 'path';
import { env } from 'process';
import { pipeline } from 'stream';

const EXECUTE_PERMISSIONS = 0o755;
const HTTP_FORBIDDEN = 403;

async function getLatestRelease(request_params = undefined) {
  try {
    const res = await fetch(
      'https://api.github.com/repos/opossum-tool/opossum-file/releases/latest',
      request_params,
    );
    const data = await res.json();
    if (
      res.status === HTTP_FORBIDDEN &&
      typeof data.message === 'string' &&
      data.message.includes('API rate limit exceeded')
    ) {
      throw new Error('API rate limit exceeded, please try again later');
    }
    return data.tag_name;
  } catch (err) {
    throw new Error(`Fetching the latest release failed: ${err.message}`);
  }
}

async function downloadBinary(
  version,
  filename,
  savepath,
  request_params = undefined,
) {
  const url = `https://github.com/opossum-tool/opossum-file/releases/download/${version}/${filename}`;
  try {
    const res = await fetch(url, request_params);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    await new Promise((resolve, reject) => {
      pipeline(res.body, fs.createWriteStream(savepath), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    console.log(`File downloaded and saved to ${savepath}`);
  } catch (err) {
    console.error(`Error downloading file: ${err.message}`);
  }
}

function prepareDownloadLocation(path) {
  const folder = dirname(path);
  if (!fs.existsSync(folder)) {
    console.info(`Creating folder ${folder}`);
    fs.mkdirSync(folder);
  }
  if (fs.existsSync(path)) {
    console.info("Deleting existing 'opossum-file'.");
    fs.rmSync(path);
  }
}

async function downloadOpossumFile(osSuffix, headers = undefined) {
  const TARGET_NAME = 'bin/opossum-file';
  const opossumFileBinaryName = `opossum-file-for-${osSuffix}`;
  prepareDownloadLocation(TARGET_NAME);

  try {
    const currentVersion = await getLatestRelease(headers);
    await downloadBinary(
      currentVersion,
      opossumFileBinaryName,
      TARGET_NAME,
      headers,
    );
    console.info(
      `Downloaded 'opossum-file@${currentVersion}' to ${TARGET_NAME}`,
    );
  } catch (error) {
    console.error(`Download of 'opossum-file' failed: ${error.message}`);
    process.exit(1);
  }

  try {
    await fs.promises.chmod(TARGET_NAME, EXECUTE_PERMISSIONS);
  } catch (error) {
    console.error('Could not mark', TARGET_NAME, 'as executable.', error);
    process.exit(1);
  }
}

function createRequestHeaders() {
  if (!env.GITHUB_TOKEN) {
    return undefined;
  }
  console.info('Found GITHUB_TOKEN.');
  return {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    },
  };
}

const osSuffix = process.argv[2];

if (!osSuffix) {
  console.error(
    'Please specify one of the following options: mac, ubuntu, windows.exe',
  );
  process.exit(1);
}

const requestHeaders = createRequestHeaders();
await downloadOpossumFile(osSuffix, requestHeaders);
