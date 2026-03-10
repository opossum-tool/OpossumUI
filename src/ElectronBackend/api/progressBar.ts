// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ComparisonOperatorExpression,
  ExpressionBuilder,
  Kysely,
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

export function getPreSelectedManualFilesQuery(
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
      attributionsPreSelectedQuery(eb, options),
    );
}

function attributionsPreSelectedQuery(
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

export async function removeManualOrExternalCwaFromResources(
  trxOrDB: Transaction<DB> | Kysely<DB>,
  type: 'manual' | 'external',
  attributionUuids: Array<string>,
  resourceIds?: Array<number>,
) {
  let finished = false;
  while (!finished) {
    const result = await trxOrDB
      .with('impacted_resources', (db) =>
        db
          .selectFrom('resource_to_attribution as rta')
          .innerJoin('resource as r', 'rta.resource_id', 'r.id')
          .select([
            'rta.resource_id',
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

export async function addManualOrExternalCwaToResources(
  trxOrDB: Transaction<DB> | Kysely<DB>,
  type: 'manual' | 'external',
  attributionUuids: Array<string>,
  resourceIds?: Array<number>,
) {
  return trxOrDB
    .with('newly_attributed_resources', (db) =>
      db
        .selectFrom('resource_to_attribution as rta')
        .innerJoin('resource as r', 'rta.resource_id', 'r.id')
        .innerJoin('cwa as previous_cwa', 'previous_cwa.resource_id', 'r.id')
        .select([
          'rta.resource_id',
          'r.max_descendant_id',
          (eb) => eb.ref(`previous_cwa.${type}`).as('previous_value'),
        ])
        .where('rta.attribution_uuid', 'in', attributionUuids)
        .$if(resourceIds !== undefined, (eb) =>
          eb.where('rta.resource_id', 'in', resourceIds as Array<number>),
        )
        .where('rta.resource_id', 'not in', (eb) =>
          eb
            .selectFrom('resource_to_attribution')
            .select('resource_id')
            .where('attribution_is_external', '=', Number(type === 'external'))
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
            ),
        )
        .select([
          'cwa.resource_id',
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
    .execute();
}
