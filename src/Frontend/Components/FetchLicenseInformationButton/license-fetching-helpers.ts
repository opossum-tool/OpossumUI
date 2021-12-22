// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import { convertPypiPayload, getPypiAPIUrl } from './pypi-fetching-helpers';
import { convertNpmPayload, getNpmAPIUrl } from './npm-fetching-helpers';
import {
  convertGithubPayload,
  getGithubAPIUrl,
} from './github-fetching-helpers';

const PYPI_REGEX = new RegExp('^https://pypi.org/(pypi|project)/[\\w-+,_]+/?$');
const NPM_REGEX = new RegExp('^https://npmjs.com/(package/)?[\\w-+,_@/]+/?$');
const GITHUB_REGEX = new RegExp('^https://github.com/');

export interface LicenseFetchingInformation {
  url: string;
  convertPayload: (payload: Response) => Promise<PackageInfo>;
}

export function getLicenseFetchingInformation(
  url?: string,
  version?: string
): LicenseFetchingInformation | null {
  if (!url) {
    return null;
  }

  if (PYPI_REGEX.test(url)) {
    return {
      url: getPypiAPIUrl(url),
      convertPayload: convertPypiPayload,
    };
  } else if (NPM_REGEX.test(url)) {
    return {
      url: getNpmAPIUrl(url, version),
      convertPayload: convertNpmPayload,
    };
  } else if (GITHUB_REGEX.test(url)) {
    return {
      url: getGithubAPIUrl(url),
      convertPayload: convertGithubPayload,
    };
  }
  return null;
}
