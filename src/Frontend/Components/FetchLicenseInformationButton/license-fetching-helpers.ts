// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../shared/shared-types';
import {
  convertGithubPayload,
  getGithubAPIUrl,
} from './github-fetching-helpers';
import { convertNpmPayload, getNpmAPIUrl } from './npm-fetching-helpers';
import { convertPypiPayload, getPypiAPIUrl } from './pypi-fetching-helpers';

const PYPI_REGEX = new RegExp(
  '^https://(www.)?pypi.org/(pypi|project)/[\\w-+,_]+/?$',
);
const NPM_REGEX = new RegExp(
  '^https://(www.)?npmjs.com/(package/)?[\\w-+,_@/]+/?$',
);
const GITHUB_REGEX = new RegExp('^https://(www.)?github.com/[^/]+/[^/]+');

export interface LicenseFetchingInformation {
  url: string;
  convertPayload: (payload: Response) => PackageInfo;
}

export function getLicenseFetchingInformation(
  url?: string,
  version?: string,
): LicenseFetchingInformation | null {
  if (!url) {
    return null;
  }

  try {
    new URL(url);
  } catch {
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
