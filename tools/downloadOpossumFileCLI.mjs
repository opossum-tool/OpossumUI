// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { dirname } from 'path';
import { pipeline } from 'stream';

const EXECUTE_PERMISSIONS = 0o755;

function getResourceName() {
  const osSuffix = process.argv[2];
  if (
    osSuffix !== 'mac-intel' &&
    osSuffix !== 'mac-arm64' &&
    osSuffix !== 'linux' &&
    osSuffix !== 'windows.exe'
  ) {
    throw new Error(
      'Please specify one of the following options: mac-intel, mac-arm64, linux, windows.exe',
    );
  }
  return `opossum-file-for-${osSuffix}`;
}

function doesOpossumExecutableExist(filePath) {
  const folderPath = dirname(filePath);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    return false;
  }
  return fs.existsSync(filePath);
}

/**
 * The following function tries to download the opossum-file CLI tool from GitHub.
 * This tool is used to convert legacy files, e.g. JSON, to Opossum files.
 * If you do not have a GitHub token in your .env you might run into rate limiting issues.
 *
 * If the download fails, due to rate limiting, however an executable already exists in your bin,
 * the function will log a warning instead of throwing an error and use the old executable.
 */
async function downloadOpossumFileCLI() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.warn(
      'No GitHub token is provided. The opossum-file download will be rate-limited.',
    );
  }

  const requestParams = githubToken
    ? { headers: { Authorization: `Bearer ${githubToken}` } }
    : undefined;
  const downloadResponse = await fetch(
    `https://github.com/opossum-tool/opossum-file/releases/latest/download/${getResourceName()}`,
    requestParams,
  );

  const executablePath = 'bin/opossum-file';
  if (doesOpossumExecutableExist(executablePath)) {
    if (!downloadResponse.ok) {
      const { birthtime } = fs.statSync(executablePath);
      console.warn(
        `The opossum-file CLI download failed, however an executable from ${birthtime.toUTCString()} exists.`,
      );
      return;
    }
    fs.rmSync(executablePath);
  }
  if (!downloadResponse.ok) {
    throw new Error(
      downloadResponse.message ??
        'Failed to download the opossum-file CLI and no prior version exists in the bin folder',
    );
  }
  await new Promise((resolve, reject) => {
    pipeline(
      downloadResponse.body,
      fs.createWriteStream(executablePath),
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
  await fs.promises.chmod(executablePath, EXECUTE_PERMISSIONS);
}

await downloadOpossumFileCLI();
