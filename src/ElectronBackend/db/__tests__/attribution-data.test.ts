// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Selectable } from 'kysely';
import { describe, expect, it } from 'vitest';

import { Criticality, type PackageInfo } from '../../../shared/shared-types';
import {
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
      originIds: ['origin'],
      preferredOverOriginIds: [],
      source: { name: 'scanner', documentConfidence: 80, additionalName: '' },
      originalAttributionSource: { name: 'original', documentConfidence: 0 },
      extra: { preserved: true },
    });
  });
});
