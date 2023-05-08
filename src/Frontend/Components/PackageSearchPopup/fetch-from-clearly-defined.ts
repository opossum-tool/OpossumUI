// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Schema, Validator } from 'jsonschema';
import axios from 'axios';
import { DisplayPackageInfo } from '../../../shared/shared-types';

const jsonSchemaValidator = new Validator();

interface Payload {
  licensed: {
    declared?: string;
    facets?: {
      core: {
        attribution: {
          parties?: Array<string>;
        };
      };
    };
  };
  coordinates: {
    type: string;
    provider: string;
    namespace?: string;
    name: string;
    revision: string;
  };
  described: {
    urls?: {
      registry?: string;
      version?: string;
    };
    sourceLocation?: {
      url?: string;
    };
  };
}

const clearlyDefinedSchema: Schema = {
  type: 'object',
  properties: {
    described: {
      type: 'object',
      properties: {
        urls: {
          type: 'object',
          properties: {
            registry: {
              type: 'string',
            },
            version: { type: 'string' },
          },
        },
        sourceLocation: {
          type: 'object',
          properties: {
            url: { type: 'string' },
          },
        },
      },
    },
    licensed: {
      type: 'object',
      properties: {
        declared: { type: 'string' },
        facets: {
          type: 'object',
          properties: {
            core: {
              type: 'object',
              properties: {
                attribution: {
                  type: 'object',
                  properties: {
                    parties: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              required: ['attribution'],
            },
          },
          required: ['core'],
        },
      },
    },
    coordinates: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        provider: { type: 'string' },
        namespace: { type: 'string' },
        name: { type: 'string' },
        revision: { type: 'string' },
      },
      required: ['type', 'provider', 'name', 'revision'],
    },
  },
  required: ['licensed', 'coordinates', 'described'],
};

export async function fetchFromClearlyDefined(
  coordinate: string
): Promise<DisplayPackageInfo> {
  const response = await axios.get(
    `https://api.clearlydefined.io/definitions/${coordinate}`
  );
  const payload = response.data as Payload;
  jsonSchemaValidator.validate(payload, clearlyDefinedSchema, {
    throwError: true,
  });
  return {
    packageName: payload?.coordinates.name,
    packageVersion: payload?.coordinates.revision,
    packageNamespace: payload?.coordinates.namespace,
    packageType: payload?.coordinates.type,
    licenseName: payload?.licensed.declared,
    copyright: payload?.licensed.facets?.core.attribution.parties
      ? concatCopyright(payload.licensed.facets.core.attribution.parties)
      : undefined,
    url:
      payload?.described.urls?.version ??
      payload?.described.sourceLocation?.url,
    attributionIds: [],
  };
}

function concatCopyright(copyrightHolders: Array<string>): string {
  return copyrightHolders.join('\n');
}
