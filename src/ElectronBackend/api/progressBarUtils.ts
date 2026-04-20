// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ComparisonOperatorExpression,
  type ExpressionBuilder,
  type Kysely,
  type OperandExpression,
  type SelectQueryBuilder,
  type Transaction,
} from 'kysely';

import { type Criticality } from '../../shared/shared-types';
import { type DB } from '../db/generated/databaseTypes';

export function getOnlyExternalFilesQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
) {
  return eb
    .selectFrom('closest_attributed_ancestors')
    .select('resource_id')
    .where('closest_attributed_ancestors.is_file', '=', 1)
    .where('closest_attributed_ancestors.manual', 'is', null)
    .where('closest_attributed_ancestors.external', 'is not', null);
}

export function getManualFilesQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
) {
  return eb
    .selectFrom('closest_attributed_ancestors')
    .select(['resource_id', 'manual'])
    .where('closest_attributed_ancestors.is_file', '=', 1)
    .where('closest_attributed_ancestors.manual', 'is not', null);
}

export function getNonPreSelectedManualFilesQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
) {
  return eb
    .selectFrom((eb) =>
      getManualFilesQuery(eb).as('closest_attributed_ancestors'),
    )
    .select('resource_id')
    .where('manual', 'in', (eb) =>
      resourcePreSelectedQuery(eb, { isPreSelected: 0 }),
    );
}

export function getOnlyPreSelectedManualFilesQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
) {
  return eb
    .selectFrom((eb) =>
      getManualFilesQuery(eb).as('closest_attributed_ancestors'),
    )
    .select('resource_id')
    .where('manual', 'in', (eb) =>
      resourcePreSelectedQuery(eb, { isPreSelected: 1 }),
    )
    .where('manual', 'not in', (eb) =>
      resourcePreSelectedQuery(eb, { isPreSelected: 0 }),
    );
}

function resourcePreSelectedQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
  options: { isPreSelected: 0 | 1 },
) {
  return eb
    .selectFrom('resource_to_attribution')
    .select('resource_id')
    .where('attribution_uuid', 'in', (eb) =>
      attributionPreSelectedQuery(eb, options),
    );
}

function attributionPreSelectedQuery(
  eb: ExpressionBuilder<DB, 'resource_to_attribution'>,
  options: { isPreSelected: 0 | 1 },
) {
  return eb
    .selectFrom('attribution')
    .select('uuid')
    .where('is_external', '=', 0)
    .where('is_resolved', '=', 0)
    .where('pre_selected', '=', options.isPreSelected);
}

export function getCriticalResourceQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
  criticality: Criticality,
) {
  return eb
    .selectFrom('closest_attributed_ancestors')
    .select('resource_id')
    .where('manual', 'is', null)
    .where('resource_id', 'in', (eb) =>
      resourceCriticalityQuery(eb, { operator: '=', criticality }),
    )
    .where('resource_id', 'not in', (eb) =>
      resourceCriticalityQuery(eb, { operator: '>', criticality }),
    );
}

function resourceCriticalityQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
  options: { operator: ComparisonOperatorExpression; criticality: Criticality },
) {
  return eb
    .selectFrom('resource_to_attribution')
    .select('resource_id')
    .where('attribution_uuid', 'in', (eb) =>
      attributionCriticalityQuery(eb, options),
    );
}

function attributionCriticalityQuery(
  eb: ExpressionBuilder<DB, 'resource_to_attribution'>,
  options: { operator: ComparisonOperatorExpression; criticality: Criticality },
) {
  return eb
    .selectFrom('attribution')
    .select('uuid')
    .where('is_external', '=', 1)
    .where('is_resolved', '=', 0)
    .where('criticality', options.operator, options.criticality);
}

export function getClassificationResourceQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
  classification: number,
) {
  return eb
    .selectFrom('closest_attributed_ancestors')
    .select('resource_id')
    .where('manual', 'is', null)
    .where('resource_id', 'in', (eb) =>
      resourceClassificationQuery(eb, {
        operator: '=',
        classification,
      }),
    )
    .where('resource_id', 'not in', (eb) =>
      resourceClassificationQuery(eb, {
        operator: '>',
        classification,
      }),
    );
}

function resourceClassificationQuery(
  eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
  options: { operator: ComparisonOperatorExpression; classification: number },
) {
  return eb
    .selectFrom('resource_to_attribution')
    .select('resource_id')
    .where('attribution_uuid', 'in', (eb) =>
      attributionClassificationQuery(eb, options),
    );
}

function attributionClassificationQuery(
  eb: ExpressionBuilder<DB, 'resource_to_attribution'>,
  options: { operator: ComparisonOperatorExpression; classification: number },
) {
  return eb
    .selectFrom('attribution')
    .select('uuid')
    .where('is_external', '=', 1)
    .where('is_resolved', '=', 0)
    .where('classification', options.operator, options.classification);
}

/**
 * Used to keep the closest_attributed_ancestors table up to date when removing attributions.
 * Takes attributionUuids as an input and checks for resources that will have no more manual/external attributions once they are removed.
 * Call BEFORE removing attributions.
 */
export async function removeManualOrExternalCaaFromResources(
  trxOrDB: Transaction<DB> | Kysely<DB>,
  type: 'manual' | 'external',
  {
    attributionUuids,
    resourceIds,
  }: {
    attributionUuids?: Array<string>;
    resourceIds?: Array<number> | OperandExpression<number>;
  },
) {
  // Run multiple times, since the parent might have different manual/external attributions after the update
  let finished = false;
  while (!finished) {
    const result = await trxOrDB
      .with('impacted_resources', (db) =>
        db
          .selectFrom('resource as r')
          .leftJoin('resource_to_attribution as rta', 'rta.resource_id', 'r.id')
          // Replace_with is the closest ancestor with manual/external attributions to the parent, if the resource is not a breakpoint
          .select([
            'r.id as resource_id',
            (eb) =>
              eb
                .case()
                .when('r.is_attribution_breakpoint', '=', 0)
                .then(
                  eb
                    .selectFrom('closest_attributed_ancestors')
                    .select(type)
                    .whereRef(
                      'closest_attributed_ancestors.resource_id',
                      '=',
                      'r.parent_id',
                    ),
                )
                .end()
                .as('replace_with'),
          ])
          .$if(attributionUuids !== undefined, (eb) =>
            eb.where(
              'rta.attribution_uuid',
              'in',
              attributionUuids as Array<string>,
            ),
          )
          .$if(resourceIds !== undefined, (eb) =>
            eb.where('r.id', 'in', resourceIds!),
          )
          // Don't change resources that still have manual/external attributions after the removal
          .where('r.id', 'not in', (eb) =>
            eb
              .selectFrom('resource_to_attribution')
              .select('resource_id')
              .where(
                'attribution_is_external',
                '=',
                Number(type === 'external'),
              )
              .$if(attributionUuids !== undefined, (eb) =>
                eb.where(
                  'attribution_uuid',
                  'not in',
                  attributionUuids as Array<string>,
                ),
              )
              .$if(type === 'external', (eb) =>
                eb.where((eb) =>
                  eb.exists(
                    eb
                      .selectFrom('attribution')
                      .selectAll()
                      .where('is_resolved', '=', 0)
                      .whereRef('uuid', '=', 'attribution_uuid'),
                  ),
                ),
              ),
          ),
      )
      .updateTable('closest_attributed_ancestors')
      .from('impacted_resources')
      .set((eb) => ({
        [type]: eb.ref('impacted_resources.replace_with'),
      }))
      .whereRef(type, '=', 'impacted_resources.resource_id')
      .execute();

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (result[0].numUpdatedRows === 0n) {
      finished = true;
    }
  }
}

/**
 * Used to keep the closest_attributed_ancestors table up to date when adding attributions.
 * Takes attributionUuids as an input and checks for resources that now have manual/external attributions.
 * Call AFTER adding attributions.
 */
export async function addManualOrExternalCaaToResources(
  trxOrDB: Transaction<DB> | Kysely<DB>,
  type: 'manual' | 'external',
  {
    attributionUuids,
    resourceIds,
  }: { attributionUuids: Array<string>; resourceIds?: Array<number> },
) {
  return (
    trxOrDB
      .with('newly_attributed_resources', (db) =>
        db
          .selectFrom('resource_to_attribution as rta')
          .innerJoin('resource as r', 'rta.resource_id', 'r.id')
          .innerJoin(
            'closest_attributed_ancestors as previous_caa',
            'previous_caa.resource_id',
            'r.id',
          )
          .select([
            'rta.resource_id',
            'r.max_descendant_id',
            (eb) => eb.ref(`previous_caa.${type}`).as('previous_value'),
            'previous_caa.breakpoint as closest_breakpoint',
          ])
          .where('rta.attribution_uuid', 'in', attributionUuids)
          .$if(resourceIds !== undefined, (eb) =>
            eb.where('rta.resource_id', 'in', resourceIds as Array<number>),
          )
          .where('rta.resource_id', 'not in', (eb) =>
            eb
              .selectFrom('resource_to_attribution')
              .select('resource_id')
              .where(
                'attribution_is_external',
                '=',
                Number(type === 'external'),
              )
              .where('attribution_uuid', 'not in', attributionUuids)
              .$if(type === 'external', (eb) =>
                eb.where((eb) =>
                  eb.exists(
                    eb
                      .selectFrom('attribution')
                      .selectAll()
                      .where('is_resolved', '=', 0)
                      .whereRef('uuid', '=', 'attribution_uuid'),
                  ),
                ),
              ),
          ),
      )
      // Get all children in the same breakpoint-subtree that point to the same resource as the newly added attributions
      .with('impacted_resources', (db) =>
        db
          .selectFrom('closest_attributed_ancestors')
          .innerJoin('newly_attributed_resources', (join) =>
            join
              .onRef(
                'closest_attributed_ancestors.resource_id',
                '>=',
                'newly_attributed_resources.resource_id',
              )
              .onRef(
                'closest_attributed_ancestors.resource_id',
                '<=',
                'newly_attributed_resources.max_descendant_id',
              )
              .onRef(
                'newly_attributed_resources.previous_value',
                'is',
                `closest_attributed_ancestors.${type}`,
              )
              .onRef(
                'newly_attributed_resources.closest_breakpoint',
                '=',
                'closest_attributed_ancestors.breakpoint',
              ),
          )
          .select([
            'closest_attributed_ancestors.resource_id',
            // Get the closest parent with manual/external attributions
            (eb) =>
              eb.fn.max('newly_attributed_resources.resource_id').as('new_id'),
          ])
          .groupBy('closest_attributed_ancestors.resource_id'),
      )
      .updateTable('closest_attributed_ancestors')
      .from('impacted_resources')
      .set((eb) => ({
        [type]: eb.ref('impacted_resources.new_id'),
      }))
      .whereRef(
        'closest_attributed_ancestors.resource_id',
        '=',
        'impacted_resources.resource_id',
      )
      .execute()
  );
}

export async function getCount(
  trxOrDb: Transaction<DB> | Kysely<DB>,
  from: (
    eb: ExpressionBuilder<DB, 'closest_attributed_ancestors'>,
  ) => SelectQueryBuilder<DB, never, unknown>,
): Promise<number> {
  const { count } = await trxOrDb
    .selectFrom((eb) => from(eb).as('table_to_count'))
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();
  return count;
}
