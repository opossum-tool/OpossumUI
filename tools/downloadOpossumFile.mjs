// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { dirname } from 'path';
import { pipeline } from 'stream';

const EXECUTE_PERMISSIONS = 0o755;

async function getLatestRelease() {
  try {
    const res = await fetch(
      'https://api.github.com/repos/opossum-tool/opossum-file/releases/latest',
    );
    const data = await res.json();
    if (
      res.status === 403 &&
      typeof data.message === 'string' &&
      data.message.includes('API rate limit exceeded')
    ) {
      throw new Error('API rate limit exceeded, please try again later');
    }
    return data.tag_name;
  } catch (err) {
    throw new Error(`Fetching the latest release failed: ${err}`);
  }
}

async function downloadBinary(version, filename, savepath) {
  const url = `https://github.com/opossum-tool/opossum-file/releases/download/${version}/${filename}`;
  try {
    const res = await fetch(url);
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
    console.error(`Error downloading file: ${err}`);
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

async function installOpossumFileCLI(osSuffix) {
  const TARGET_NAME = 'bin/opossum-file';
  const opossumFileBinaryName = 'opossum-file-for-' + osSuffix;
  prepareDownloadLocation(TARGET_NAME);

  try {
    const currentVersion = await getLatestRelease();
    await downloadBinary(currentVersion, opossumFileBinaryName, TARGET_NAME);
    console.info(
      `Downloaded 'opossum-file@${currentVersion}' to ${TARGET_NAME}`,
    );
  } catch (error) {
    console.error(`Download of 'opossum-file' failed: ${err}`);
    process.exit(1);
  }

  try {
    await fs.promises.chmod(TARGET_NAME, EXECUTE_PERMISSIONS);
  } catch (error) {
    console.error('Could not mark', TARGET_NAME, 'as executable.', error);
    process.exit(1);
  }
}

const osSuffix = process.argv[2];

if (!osSuffix) {
  console.error(
    'Please specify one of the following options: mac, ubuntu, windows.exe',
  );
  process.exit(1);
}

await installOpossumFileCLI(osSuffix);
