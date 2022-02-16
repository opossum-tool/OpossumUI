// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import { Schema, Validator } from 'jsonschema';

export function getNpmAPIUrl(url: string, version?: string): string {
  const packageName = url
    .replace(new RegExp('^https://npmjs.com/(package/)?'), '')
    .replace(new RegExp('/$'), '');
  return `https://registry.npmjs.org/${packageName}${
    version ? `/${version}` : ''
  }`;
}

const jsonSchemaValidator = new Validator();

const NPM_SCHEMA: Schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    license: { type: 'string' },
  },
  required: ['name', 'license'],
};

export async function convertNpmPayload(
  payload: Response
): Promise<PackageInfo> {
  const convertedPayload = await payload.json();
  jsonSchemaValidator.validate(convertedPayload, NPM_SCHEMA, {
    throwError: true,
  });
  return {
    licenseName: convertedPayload.license as string,
    packageName: convertedPayload.name as string,
    packageType: 'npm',
    packageNamespace: undefined,
    packagePURLAppendix: undefined,
  };
}
