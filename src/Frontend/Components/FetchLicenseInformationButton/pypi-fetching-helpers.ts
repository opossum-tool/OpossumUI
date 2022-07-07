// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Schema, Validator } from 'jsonschema';
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

interface Payload {
  info: {
    license: string;
    name: string;
  };
}

export function convertPypiPayload(payload: Response): PackageInfo {
  const convertedPayload = payload as unknown as Payload;
  jsonSchemaValidator.validate(convertedPayload, PYPI_SCHEMA, {
    throwError: true,
  });
  return {
    licenseName: convertedPayload.info.license,
    packageName: convertedPayload.info.name,
    packageType: 'pypi',
    packageNamespace: undefined,
    packagePURLAppendix: undefined,
  };
}
