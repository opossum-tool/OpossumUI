// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { type SortOption } from '../../Frontend/Components/SortButton/useSortingOptions';
import { type Filter } from '../../Frontend/shared-constants';
import { type Attributions, type PackageInfo } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { getFilterExpression, getSearchExpression } from './filters';
import {
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  type ResourceRelationship,
  toCanonicalLicenseName,
} from './utils';

export async function listAttributions(props: {
  external?: boolean;
  filters?: Array<Filter>;
  resourcePathForRelationships?: string;
  sort?: SortOption;
  license?: string;
  search?: string;
  showResolved?: boolean;
  excludeUnrelated?: boolean;
  uuids?: Array<string>;
}): Promise<{ result: Attributions }> {
  if (props.uuids?.length === 0) {
    return { result: {} };
  }

  const attributions = await getDb()
    .transaction()
    .execute(async (trx) => {
      const resourceForRelationships = props.resourcePathForRelationships
        ? await getResourceOrThrow(trx, props.resourcePathForRelationships)
        : undefined;

      const closestAncestor = resourceForRelationships
        ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
            trx,
            resourceForRelationships.id,
          )
        : undefined;

      let query = trx
        .selectFrom('attribution')
        .select('uuid')
        .select('data')
        .select(
          attributionToResourceRelationship({
            resource: resourceForRelationships,
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
        .$if(resourceForRelationships !== undefined, (qb) =>
          qb.select((eb) =>
            eb
              .selectFrom('resource_to_attribution')
              .select(eb.fn.countAll<number>().as('count'))
              .whereRef('attribution_uuid', '=', 'uuid')
              .where((eb) =>
                eb.between(
                  'resource_id',
                  resourceForRelationships!.id,
                  resourceForRelationships!.max_descendant_id,
                ),
              )
              .as('resource_count_below'),
          ),
        );

      if (props.external !== undefined) {
        query = query.where('is_external', '=', Number(props.external));
      }

      if (props.excludeUnrelated) {
        query = query.where(
          attributionToResourceRelationship({
            resource: resourceForRelationships,
            ancestorId: closestAncestor,
          }),
          '!=',
          'unrelated',
        );
      }

      if (props.filters) {
        for (const filter of props.filters) {
          query = query.where(getFilterExpression(filter));
        }
      }

      if (props.license) {
        query = query.where(
          'canonical_license_name',
          '=',
          toCanonicalLicenseName(props.license),
        );
      }

      if (props.search) {
        const search = props.search;
        query = query.where(getSearchExpression(search));
      }

      if (!props.showResolved) {
        query = query.where('is_resolved', '=', 0);
      }

      if (props.uuids) {
        query = query.where('uuid', 'in', props.uuids);
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

      return query.execute();
    });

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
          count:
            a.relationship !== 'unrelated' && 'resource_count_below' in a
              ? (a.resource_count_below ?? 0)
              : (a.resource_count ?? 0),
        },
      ]),
    ),
  };
}
