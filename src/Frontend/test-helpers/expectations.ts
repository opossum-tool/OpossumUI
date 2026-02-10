// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from '../../ElectronBackend/db/db';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import {
  getManualAttributions,
  getResolvedExternalAttributions,
  getResourcesToManualAttributions,
} from '../state/selectors/resource-selectors';
import { State } from '../types/types';
import { flushPendingMutations } from './general-test-helpers';

export async function expectManualAttributions(
  state: State,
  manualAttributions: Attributions,
) {
  await flushPendingMutations();

  expect(getManualAttributions(state)).toEqual(manualAttributions);

  const dbResult = await getDb()
    .selectFrom('attribution')
    .select(['uuid', 'data'])
    .where('is_external', '=', Number(false))
    .execute();

  const dbManualAttributions = Object.fromEntries(
    dbResult.map((row) => [row.uuid, JSON.parse(row.data)]),
  );

  expect(dbManualAttributions).toEqual(manualAttributions);
}

export async function expectResourcesToManualAttributions(
  state: State,
  resourcesToAttributions: ResourcesToAttributions,
) {
  await flushPendingMutations();

  expect(getResourcesToManualAttributions(state)).toEqual(
    resourcesToAttributions,
  );

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

  expect(dbResourcesToManualAttributions).toEqual(resourcesToAttributions);
}

export async function expectResolvedExternalAttributions(
  state: State,
  resolvedExternalAttributions: Set<string>,
) {
  await flushPendingMutations();

  expect(getResolvedExternalAttributions(state)).toEqual(
    resolvedExternalAttributions,
  );

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
