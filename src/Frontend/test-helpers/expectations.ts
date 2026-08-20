// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import {
  getAttributionExtensionData,
  getAttributionPersistenceValues,
} from '../../ElectronBackend/db/attributionData';
import { getDb } from '../../ElectronBackend/db/db';
import type {
  Attributions,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { backend } from '../util/backendClient';

export async function expectManualAttributions(
  manualAttributions: Attributions,
) {
  const dbResult = await getDb()
    .selectFrom('attribution')
    .selectAll()
    .where('is_external', '=', Number(false))
    .execute();

  expect(dbResult.map(({ uuid }) => uuid).toSorted()).toEqual(
    Object.keys(manualAttributions).toSorted(),
  );

  for (const [uuid, attribution] of Object.entries(manualAttributions)) {
    const row = dbResult.find((candidate) => candidate.uuid === uuid);
    expect(row).toBeDefined();
    const { additional_data: _additionalData, ...columnValues } =
      getAttributionPersistenceValues(attribution);
    expect(row).toMatchObject({
      uuid,
      ...columnValues,
    });
    expect(JSON.parse(row!.additional_data)).toEqual(
      getAttributionExtensionData(attribution),
    );
  }
}

export async function expectResourcesToManualAttributions(
  resourcesToAttributions: ResourcesToAttributions,
) {
  const dbResult = await getDb()
    .selectFrom('resource_to_attribution')
    .innerJoin('resource', 'resource.id', 'resource_to_attribution.resource_id')
    .innerJoin(
      'attribution',
      'attribution.uuid',
      'resource_to_attribution.attribution_uuid',
    )
    .select([
      sql<string>`path || IF(can_have_children, '/', '')`.as('path'),
      'attribution_uuid',
    ])
    .where('attribution.is_external', '=', Number(false))
    .execute();

  const dbResourcesToManualAttributions: ResourcesToAttributions = {};
  for (const row of dbResult) {
    if (!(row.path in dbResourcesToManualAttributions)) {
      dbResourcesToManualAttributions[row.path] = [];
    }
    dbResourcesToManualAttributions[row.path].push(row.attribution_uuid);
  }

  // Sort arrays to make comparison order-independent
  for (const path in dbResourcesToManualAttributions) {
    dbResourcesToManualAttributions[path].sort();
  }
  for (const path in resourcesToAttributions) {
    resourcesToAttributions[path].sort();
  }

  expect(dbResourcesToManualAttributions).toEqual(resourcesToAttributions);
}

export async function expectResolvedExternalAttributions(
  resolvedExternalAttributions: Set<string>,
) {
  const queryResult = await backend.resolvedAttributionUuids.query();
  expect(queryResult).toEqual(resolvedExternalAttributions);

  const dbResult = await getDb()
    .selectFrom('attribution')
    .select('uuid')
    .where('is_external', '=', Number(true))
    .where('is_resolved', '=', Number(true))
    .execute();

  const dbResolvedExternalAttributions = new Set(
    dbResult.map((row) => row.uuid),
  );

  expect(dbResolvedExternalAttributions).toEqual(resolvedExternalAttributions);
}
