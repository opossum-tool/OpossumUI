import {
  ComparisonOperatorExpression,
  ExpressionBuilder,
  Kysely,
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
    // We want to find resources that do not have manual attributions and have critical ones
    .where('manual', 'is', null)
    .where('resource_id', 'in', (eb) =>
      resourceCriticalityQuery(eb, { operator: '=', criticality }),
    )
    .where('resource_id', 'not in', (eb) =>
      resourceCriticalityQuery(eb, { operator: '>', criticality }),
    )
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

export async function getExternalClassificationCount(
  dbOrTrx: Kysely<DB>,
  classification: number,
) {
  return await dbOrTrx
    .selectFrom('cwa')
    .select((eb) => eb.fn.countAll<number>().as('classification_count'))
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
    )
    .executeTakeFirstOrThrow();
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
