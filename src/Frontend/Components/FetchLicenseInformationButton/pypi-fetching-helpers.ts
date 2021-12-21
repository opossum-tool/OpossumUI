// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Validator, Schema } from 'jsonschema';
import { PackageInfo } from '../../../shared/shared-types';

export function getPypiAPIUrl(url: string): string {
  const packageName = url
    .split('/')
    .filter((x) => x)
    .slice(-1)[0];

  return `https://pypi.org/pypi/${packageName}/json`;
}

const jsonSchemaValidator = new Validator();

const PYPI_SCHEMA: Schema = {
  type: 'object',
  properties: {
    info: {
      type: 'object',
      properties: {
        license: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
      },
      required: ['license', 'name'],
    },
  },
  required: ['info'],
};

export async function convertPypiPayload(
  payload: Response
): Promise<PackageInfo> {
  const convertedPayload = await payload.json();
  jsonSchemaValidator.validate(convertedPayload, PYPI_SCHEMA, {
    throwError: true,
  });
  return {
    licenseName: convertedPayload.info.license as string,
    packageName: convertedPayload.info.name as string,
    packageType: 'pypi',
    packageNamespace: undefined,
    packagePURLAppendix: undefined,
  };
}
