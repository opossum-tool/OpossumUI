// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import { Schema, Validator } from 'jsonschema';

export function getNpmAPIUrl(url: string, version?: string): string {
  const packageName = url
    .replace(new RegExp('^https://(www.)?npmjs.com/(package/)?'), '')
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

interface Payload {
  name: string;
  license: string;
}

export function convertNpmPayload(payload: unknown): PackageInfo {
  jsonSchemaValidator.validate(payload, NPM_SCHEMA, {
    throwError: true,
  });

  const validatedPayload = payload as Payload;

  return {
    licenseName: validatedPayload.license,
    packageName: validatedPayload.name,
    packageType: 'npm',
    packageNamespace: undefined,
    packagePURLAppendix: undefined,
  };
}
