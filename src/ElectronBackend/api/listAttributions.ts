// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { SortOption } from '../../Frontend/Components/SortButton/useSortingOptions';
import { Filter } from '../../Frontend/shared-constants';
import { Attributions, PackageInfo } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { getFilterExpression, getSearchExpression } from './filters';
import {
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  type ResourceRelationship,
} from './utils';

export async function listAttributions(props: {
  external: boolean;
  filters: Array<Filter>;
  resourcePathForRelationships: string;
  sort?: SortOption;
  license?: string;
  search?: string;
  showResolved?: boolean;
  excludeUnrelated?: boolean;
}): Promise<{ result: Attributions }> {
  const db = getDb();
  const resource = await getResourceOrThrow(
    db,
    props.resourcePathForRelationships,
  );

  const closestAncestor =
    await getClosestAncestorWithManualAttributionsBelowBreakpoint(
      db,
      resource.id,
    );

  let query = db
    .selectFrom('attribution')
    .select('uuid')
    .select('data')
    .select(
      attributionToResourceRelationship({
        resource,
        ancestorId: closestAncestor,
      })
        .$castTo<ResourceRelationship>()
        .as('relationship'),
    )
    .select((eb) =>
      eb
        .selectFrom('resource_to_attribution')
        .select(eb.fn.countAll<number>().as('count'))
        .whereRef('attribution_uuid', '=', 'uuid')
        .as('resource_count'),
    )
    .where('is_external', '=', Number(props.external));

  if (props.excludeUnrelated) {
    query = query.where(
      attributionToResourceRelationship({
        resource,
        ancestorId: closestAncestor,
      }),
      '!=',
      'unrelated',
    );
  }

  for (const filter of props.filters) {
    query = query.where((eb) => getFilterExpression(eb, filter));
  }

  if (props.license) {
    query = query.where(sql<string>`trim(license_name)`, '=', props.license);
  }

  if (props.search) {
    const search = props.search;
    query = query.where((eb) => getSearchExpression(eb, search));
  }

  if (!props.showResolved) {
    query = query.where('is_resolved', '=', 0);
  }

  if (props.sort === 'classification') {
    query = query.orderBy('classification', 'desc');
  } else if (props.sort === 'criticality') {
    query = query.orderBy('criticality', 'desc');
  } else if (props.sort === 'occurrence') {
    query = query.orderBy('resource_count', 'desc');
  }

  // Alphabetically by label. The label calculation is more complicated, so this is an approximation (but good enough)
  query = query.orderBy((eb) =>
    eb
      .case()
      .when('first_party', '=', 1)
      .then(eb.fn<string>('concat', [eb.val('First Party'), 'comment']))
      .else(
        eb.fn<string>('concat', [
          'package_name',
          'license_name',
          'copyright',
          sql`data->>'licenseText'`,
          'comment',
          'url',
        ]),
      )
      .end(),
  );

  const attributions = await query.execute();

  const backendToFrontendRelationship = {
    same: 'resource',
    descendant: 'children',
    ancestor: 'parents',
    unrelated: 'unrelated',
  } as const;

  return {
    result: Object.fromEntries(
      attributions.map((a) => [
        a.uuid,
        {
          ...(JSON.parse(a.data) as PackageInfo),
          relation: backendToFrontendRelationship[a.relationship],
          count: a.resource_count ?? 0,
        },
      ]),
    ),
  };
}
