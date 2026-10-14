// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Selectable } from 'kysely';
import { describe, expect, it } from 'vitest';

import { Criticality, type PackageInfo } from '../../../shared/shared-types';
import {
  attributionContentFromRow,
  getAttributionPersistenceValues,
  packageInfoFromAttributionRow,
} from '../attributionData';
import type { Attribution } from '../generated/databaseTypes';

describe('attribution persistence conversion', () => {
  it('persists typed fields and reconstructs additional data', () => {
    const attribution: PackageInfo & { extra: { preserved: boolean } } = {
      id: 'id',
      criticality: Criticality.High,
      classification: 0,
      attributionConfidence: 0,
      firstParty: true,
      packageName: 'package',
      packageVersion: '2.0',
      packageNamespace: 'namespace',
      packageType: 'npm',
      packagePURLAppendix: '?classifier=sources#/src',
      url: 'https://example.com',
      copyright: 'copyright',
      licenseName: 'license',
      licenseText: 'license text',
      comment: 'comment',
      originIds: ['origin'],
      preferredOverOriginIds: [],
      source: { name: 'scanner', documentConfidence: 80, additionalName: '' },
      originalAttributionSource: { name: 'original', documentConfidence: 0 },
      extra: { preserved: true },
    };
    const persistenceValues = getAttributionPersistenceValues(attribution);
    expect(JSON.parse(persistenceValues.additional_data)).toEqual({
      extra: { preserved: true },
    });

    const row = {
      ...persistenceValues,
      uuid: 'id',
      is_external: 0,
      is_resolved: 0,
      resource_access: 0,
      canonical_license_name: null,
    } as Selectable<Attribution>;

    expect(packageInfoFromAttributionRow(row)).toEqual({
      id: 'id',
      criticality: Criticality.High,
      preSelected: false,
      firstParty: true,
      excludeFromNotice: false,
      wasPreferred: false,
      followUp: false,
      needsReview: false,
      preferred: false,
      originalAttributionWasPreferred: false,
      classification: 0,
      attributionConfidence: 0,
      packageName: 'package',
      packageVersion: '2.0',
      packageNamespace: 'namespace',
      packageType: 'npm',
      packagePURLAppendix: '?classifier=sources#/src',
      url: 'https://example.com',
      copyright: 'copyright',
      licenseName: 'license',
      licenseText: 'license text',
      comment: 'comment',
      originIds: ['origin'],
      preferredOverOriginIds: [],
      source: { name: 'scanner', documentConfidence: 80, additionalName: '' },
      originalAttributionSource: { name: 'original', documentConfidence: 0 },
      extra: { preserved: true },
    });
  });

  it('projects only content columns and preserves database precedence', () => {
    const row = {
      ...getAttributionPersistenceValues({
        id: 'id',
        criticality: Criticality.None,
        packageName: 'database-name',
        packageVersion: '1.0',
        packageNamespace: 'namespace',
        packageType: 'npm',
        packagePURLAppendix: '?classifier=sources#/src',
        url: 'https://example.com',
        copyright: 'copyright',
        licenseName: 'license',
        licenseText: 'license text',
        firstParty: false,
        comment: 'comment',
      }),
      uuid: 'id',
      source_name: 'database-source',
      source_document_confidence: 80,
      source_additional_name: null,
      original_attribution_source_name: null,
      original_attribution_source_document_confidence: null,
      original_attribution_source_additional_name: null,
      is_external: 0,
      is_resolved: 0,
      resource_access: 0,
      canonical_license_name: null,
    } as Selectable<Attribution>;

    expect(attributionContentFromRow(row)).toEqual({
      packageName: 'database-name',
      packageVersion: '1.0',
      packageNamespace: 'namespace',
      packageType: 'npm',
      packagePURLAppendix: '?classifier=sources#/src',
      url: 'https://example.com',
      copyright: 'copyright',
      licenseName: 'license',
      licenseText: 'license text',
      firstParty: false,
      comment: 'comment',
    });
    expect(
      packageInfoFromAttributionRow({
        ...row,
        additional_data: JSON.stringify({
          packageName: 'extension-name',
          source: { name: 'extension-source' },
          extensionValue: 'kept',
        }),
      }),
    ).toMatchObject({
      packageName: 'database-name',
      source: { name: 'database-source', documentConfidence: 80 },
      extensionValue: 'kept',
    });
  });

  it('maps null content columns to missing values', () => {
    const row = {
      ...getAttributionPersistenceValues({ id: 'id', criticality: 0 }),
      uuid: 'id',
      is_external: 0,
      is_resolved: 0,
      resource_access: 0,
      canonical_license_name: null,
    } as Selectable<Attribution>;

    expect(attributionContentFromRow(row)).toEqual({
      packageName: undefined,
      packageVersion: undefined,
      packageNamespace: undefined,
      packageType: undefined,
      packagePURLAppendix: undefined,
      url: undefined,
      copyright: undefined,
      licenseName: undefined,
      licenseText: undefined,
      firstParty: false,
      comment: undefined,
    });
  });
});
