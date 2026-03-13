// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ComparisonOperatorExpression,
  ExpressionBuilder,
  Kysely,
  OperandExpression,
  SelectQueryBuilder,
  Transaction,
} from 'kysely';

import { Criticality } from '../../shared/shared-types';
import { DB } from '../db/generated/databaseTypes';

export function getOnlyExternalFilesQuery(eb: ExpressionBuilder<DB, 'cwa'>) {
  return eb
    .selectFrom('cwa')
    .select('resource_id')
    .where('cwa.is_file', '=', 1)
    .where('cwa.manual', 'is', null)
    .where('cwa.external', 'is not', null);
}

export function getManualFilesQuery(eb: ExpressionBuilder<DB, 'cwa'>) {
  return eb
    .selectFrom('cwa')
    .select(['resource_id', 'manual'])
    .where('cwa.is_file', '=', 1)
    .where('cwa.manual', 'is not', null);
}

export function getNonPreSelectedManualFilesQuery(
  eb: ExpressionBuilder<DB, 'cwa'>,
) {
  return eb
    .selectFrom((eb) => getManualFilesQuery(eb).as('cwa'))
    .select('resource_id')
    .where('manual', 'in', (eb) =>
      resourcePreSelectedQuery(eb, { isPreSelected: 0 }),
    );
}

export function getOnlyPreSelectedManualFilesQuery(
  eb: ExpressionBuilder<DB, 'cwa'>,
) {
  return eb
    .selectFrom((eb) => getManualFilesQuery(eb).as('cwa'))
    .select('resource_id')
    .where('manual', 'in', (eb) =>
      resourcePreSelectedQuery(eb, { isPreSelected: 1 }),
    )
    .where('manual', 'not in', (eb) =>
      resourcePreSelectedQuery(eb, { isPreSelected: 0 }),
    );
}

function resourcePreSelectedQuery(
  eb: ExpressionBuilder<DB, 'cwa'>,
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
  eb: ExpressionBuilder<DB, 'cwa'>,
  criticality: Criticality,
) {
  return eb
    .selectFrom('cwa')
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
  eb: ExpressionBuilder<DB, 'cwa'>,
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
  eb: ExpressionBuilder<DB, 'cwa'>,
  classification: number,
) {
  return eb
    .selectFrom('cwa')
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
  eb: ExpressionBuilder<DB, 'cwa'>,
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
 * Used to keep the cwa table up to date when removing attributions.
 * Takes attributionUuids as an input and checks for resources that will have no more manual/external attributions once they are removed.
 * Call BEFORE removing attributions.
 */
export async function removeManualOrExternalCwaFromResources(
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
                    .selectFrom('cwa')
                    .select(type)
                    .whereRef('cwa.resource_id', '=', 'r.parent_id'),
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
      .updateTable('cwa')
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
 * Used to keep the cwa table up to date when adding attributions.
 * Takes attributionUuids as an input and checks for resources that now have manual/external attributions.
 * Call AFTER adding attributions.
 */
export async function addManualOrExternalCwaToResources(
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
          .innerJoin('cwa as previous_cwa', 'previous_cwa.resource_id', 'r.id')
          .select([
            'rta.resource_id',
            'r.max_descendant_id',
            (eb) => eb.ref(`previous_cwa.${type}`).as('previous_value'),
            'previous_cwa.breakpoint as closest_breakpoint',
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
          .selectFrom('cwa')
          .innerJoin('newly_attributed_resources', (join) =>
            join
              .onRef(
                'cwa.resource_id',
                '>=',
                'newly_attributed_resources.resource_id',
              )
              .onRef(
                'cwa.resource_id',
                '<=',
                'newly_attributed_resources.max_descendant_id',
              )
              .onRef(
                'newly_attributed_resources.previous_value',
                'is',
                `cwa.${type}`,
              )
              .onRef(
                'newly_attributed_resources.closest_breakpoint',
                '=',
                'cwa.breakpoint',
              ),
          )
          .select([
            'cwa.resource_id',
            // Get the closest parent with manual/external attributions
            (eb) =>
              eb.fn.max('newly_attributed_resources.resource_id').as('new_id'),
          ])
          .groupBy('cwa.resource_id'),
      )
      .updateTable('cwa')
      .from('impacted_resources')
      .set((eb) => ({
        [type]: eb.ref('impacted_resources.new_id'),
      }))
      .whereRef('cwa.resource_id', '=', 'impacted_resources.resource_id')
      .execute()
  );
}

export async function getCount(
  trxOrDb: Transaction<DB> | Kysely<DB>,
  from: (
    eb: ExpressionBuilder<DB, 'cwa'>,
  ) => SelectQueryBuilder<DB, never, unknown>,
): Promise<number> {
  const { count } = await trxOrDb
    .selectFrom((eb) => from(eb).as('table_to_count'))
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();
  return count;
}
