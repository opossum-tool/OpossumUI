// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Expression,
  type ExpressionBuilder,
  expressionBuilder,
  type SqlBool,
  type Transaction,
} from 'kysely';

import type { DB } from '../db/generated/databaseTypes';
import { jsonArraySelection } from '../db/json-array-selection';
import {
  getOnlyExternalFilesQuery,
  getOnlyPreSelectedManualFilesQuery,
} from './progressBarUtils';
import { removeTrailingSlash, toCanonicalLicenseName } from './utils';

export type FilteredTable = {
  filtered_resources: { cache_id: number; id: number };
};
export type LicenseFilter = { licenseName: string; external: boolean };
export type ResourceTreeFilters = {
  search?: string;
  onlyUnreviewedFiles?: boolean;
  licenseFilter?: LicenseFilter;
  onAttributionUuids?: Array<string>;
  onlyWritable?: boolean;
};

function hasActiveNonSearchFilters(filters: ResourceTreeFilters) {
  return Boolean(
    filters.licenseFilter ||
    filters.onAttributionUuids ||
    filters.onlyUnreviewedFiles ||
    filters.onlyWritable,
  );
}

export function hasActiveFilters(filters: ResourceTreeFilters) {
  return Boolean(filters.search || hasActiveNonSearchFilters(filters));
}

function filteredResourcesContainIdBetween(
  cacheId: number,
  a: Expression<number>,
  b: Expression<number>,
) {
  const eb = expressionBuilder<DB & FilteredTable>();
  return eb.exists((eb) =>
    eb
      .selectFrom('filtered_resources')
      .selectAll()
      .where('cache_id', '=', cacheId)
      .where((eb) => eb.between('id', a, b)),
  );
}

export function getMatchesFiltersExpression({
  id,
  path,
  name,
  filters,
  cacheId,
}: {
  id: Expression<number>;
  path: Expression<string>;
  name: Expression<string>;
  filters: ResourceTreeFilters;
  cacheId: number;
}) {
  const eb = expressionBuilder<DB & FilteredTable>();
  if (hasActiveNonSearchFilters(filters)) {
    return filteredResourcesContainIdBetween(cacheId, id, id);
  }
  return getSearchMatchExpression(eb, path, name, filters.search);
}

export function getSearchMatchExpression<TDB, TB extends keyof TDB & string>(
  eb: ExpressionBuilder<TDB, TB>,
  path: Expression<string>,
  name: Expression<string>,
  search: string | undefined,
) {
  const normalizedSearch = removeTrailingSlash(search ?? '');
  const lastSearchPart = normalizedSearch.split('/').at(-1);

  return eb.and([
    eb(path, 'like', `%${normalizedSearch}%`),
    eb(name, 'like', `%${lastSearchPart}%`),
  ]);
}

export function getVisibleWithFiltersExpression({
  id,
  maxDescendantId,
  hasEditableDescendant,
  inheritedMatch,
  filters,
  cacheId,
}: {
  id: Expression<number>;
  maxDescendantId: Expression<number>;
  hasEditableDescendant: Expression<number>;
  inheritedMatch: Expression<SqlBool>;
  filters: ResourceTreeFilters;
  cacheId: number;
}) {
  const eb = expressionBuilder<DB & FilteredTable>();
  return eb.or([
    filteredResourcesContainIdBetween(cacheId, id, maxDescendantId),
    filters.onlyWritable
      ? eb.and([eb(hasEditableDescendant, '=', 1), inheritedMatch])
      : inheritedMatch,
  ]);
}

export function getFilteredResourcesQuery(
  trx: Transaction<DB>,
  {
    licenseFilter,
    onlyUnreviewedFiles,
    onAttributionUuids,
    search,
    onlyWritable,
  }: ResourceTreeFilters,
) {
  let query = trx.selectFrom('resource as r').select('r.id as id');
  if (search) {
    query = query.where('r.path', 'like', `%${removeTrailingSlash(search)}%`);
  }
  if (licenseFilter) {
    query = query.where('r.id', 'in', (eb) =>
      eb
        .selectFrom('attribution as a')
        .innerJoin(
          'resource_to_attribution as rta',
          'rta.attribution_uuid',
          'a.uuid',
        )
        .select('rta.resource_id')
        .where('a.is_external', '=', Number(licenseFilter.external))
        .where(
          'a.canonical_license_name',
          '=',
          toCanonicalLicenseName(licenseFilter.licenseName),
        ),
    );
  }
  if (onAttributionUuids) {
    query = query.where('r.id', 'in', (eb) =>
      eb
        .selectFrom('resource_to_attribution as rta')
        .select('rta.resource_id')
        .where(
          'rta.attribution_uuid',
          'in',
          jsonArraySelection(onAttributionUuids),
        ),
    );
  }
  if (onlyUnreviewedFiles) {
    const filterExpressionBuilder = expressionBuilder<
      DB,
      'closest_attributed_ancestors'
    >();
    query = query
      .where((eb) =>
        eb.or([
          eb('r.id', 'in', getOnlyExternalFilesQuery(filterExpressionBuilder)),
          eb(
            'r.id',
            'in',
            getOnlyPreSelectedManualFilesQuery(filterExpressionBuilder),
          ),
        ]),
      )
      .where('r.is_file', '=', 1)
      .where('r.is_readonly', '=', 0);
  }
  if (onlyWritable) {
    query = query.where('r.is_readonly', '=', 0);
  }
  return query;
}
