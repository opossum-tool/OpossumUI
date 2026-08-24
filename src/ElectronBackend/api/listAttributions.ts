// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SortOption } from '../../Frontend/Components/SortButton/useSortingOptions';
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../shared/attribution-filters';
import type { Attributions, PackageInfo } from '../../shared/shared-types';
import { packageInfoFromAttributionRow } from '../db/attributionData';
import { getDb } from '../db/db';
import { AttributionResourceAccess } from '../types/types';
import { getAttributionListWhereExpressions } from './attribution-list-query-utils';
import {
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  type ResourceRelationship,
} from './utils';

export type ListAttributionsProps = {
  external?: boolean;
  filters?: Array<AttributionFilterKey>;
  resourcePathForRelationships?: string;
  sort?: SortOption;
  valueFilters?: AttributionValueFilters;
  search?: string;
  showResolved?: boolean;
  excludeUnrelated?: boolean;
  uuids?: Array<string>;
  includeReadonly?: boolean;
};

export async function listAttributions(
  props: ListAttributionsProps,
): Promise<{ result: Attributions }> {
  if (props.uuids?.length === 0) {
    return { result: {} };
  }

  const attributions = await getDb()
    .transaction()
    .execute(async (trx) => {
      const resourceForRelationships = props.resourcePathForRelationships
        ? await getResourceOrThrow(trx, props.resourcePathForRelationships)
        : undefined;

      // External attributions don't have inference, so showing the ancestor attributions would be confusing
      const closestAncestor =
        !props.external && resourceForRelationships
          ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
              trx,
              resourceForRelationships.id,
            )
          : undefined;

      let query = trx
        .selectFrom('attribution')
        .selectAll('attribution')
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

      for (const expression of getAttributionListWhereExpressions(
        props,
        resourceForRelationships,
        closestAncestor,
      )) {
        query = query.where(expression);
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
              'license_text',
              'comment',
              'url',
            ]),
          )
          .end(),
      );
      query = query.orderBy('uuid', 'asc');

      return query.execute();
    });

  const backendToFrontendRelationship = {
    same: 'resource',
    descendant: 'children',
    ancestor: 'parents',
    unrelated: 'unrelated',
  } as const;

  function getCount(attribution: (typeof attributions)[number]) {
    if (
      attribution.relationship === 'same' ||
      attribution.relationship === 'ancestor'
    ) {
      return undefined;
    }

    if (attribution.relationship === 'descendant') {
      return attribution.resource_count_below ?? 0;
    }

    return attribution.resource_count ?? 0;
  }

  return {
    result: Object.fromEntries(
      attributions.map((a) => [
        a.uuid,
        {
          ...packageInfoFromAttributionRow(a),
          resourceAccess:
            a.resource_access === AttributionResourceAccess.Mixed
              ? 'mixed'
              : a.resource_access === AttributionResourceAccess.Readonly
                ? 'readonly'
                : 'writable',
          relation: backendToFrontendRelationship[a.relationship],
          count: getCount(a),
        } satisfies PackageInfo,
      ]),
    ),
  };
}
