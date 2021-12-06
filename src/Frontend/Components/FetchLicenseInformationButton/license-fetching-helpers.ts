// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import { convertPypiPayload, getPypiAPIUrl } from './pypi-fetching-helpers';

const PYPI_REGEX = new RegExp('^https://pypi.org/(pypi|project)/[\\w-+,_]+/?$');

export interface LicenseFetchingInformation {
  url: string;
  convertPayload: (payload: Response) => Promise<PackageInfo>;
}

export function getLicenseFetchingInformation(
  url?: string
): LicenseFetchingInformation | null {
  if (!url) {
    return null;
  }

  if (PYPI_REGEX.test(url)) {
    return {
      url: getPypiAPIUrl(url),
      convertPayload: convertPypiPayload,
    };
  }
  return null;
}
