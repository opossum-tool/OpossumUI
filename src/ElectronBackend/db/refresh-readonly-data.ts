// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getDb } from './db';
import {
  initializeAttributionResourceAccess,
  initializeClosestAttributedAncestorsTable,
} from './initializeDb';

export async function refreshReadonlyData() {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await trx
        .withRecursive('resource_readonly', (eb) =>
          eb
            .selectFrom('resource as r')
            .leftJoin('readonly_rule as rule', (join) =>
              join.on((eb) => eb('rule.path', '=', '/')),
            )
            .select([
              'r.id',
              (eb) =>
                eb.fn.coalesce('rule.readonly', eb.lit(0)).as('is_readonly'),
            ])
            .where('r.path', '=', '')
            .unionAll((eb) =>
              eb
                .selectFrom('resource as child')
                .innerJoin(
                  'resource_readonly as parent',
                  'parent.id',
                  'child.parent_id',
                )
                .leftJoin('readonly_rule as rule', 'rule.path', 'child.path')
                .select([
                  'child.id',
                  (eb) =>
                    eb.fn
                      .coalesce('rule.readonly', 'parent.is_readonly')
                      .as('is_readonly'),
                ]),
            ),
        )
        .updateTable('resource')
        .set((eb) => ({
          is_readonly: eb
            .selectFrom('resource_readonly')
            .select('is_readonly')
            .whereRef('resource_readonly.id', '=', 'resource.id'),
        }))
        .execute();

      await trx
        .updateTable('resource as parent')
        .set((eb) => ({
          has_editable_descendant: eb
            .case()
            .when(
              eb.exists(
                eb
                  .selectFrom('resource as descendant')
                  .select('descendant.id')
                  .where((eb) =>
                    eb.between(
                      'descendant.id',
                      eb.ref('parent.id'),
                      eb.ref('parent.max_descendant_id'),
                    ),
                  )
                  .where('descendant.is_readonly', '=', 0),
              ),
            )
            .then(1)
            .else(0)
            .end(),
        }))
        .execute();

      await trx.schema.dropTable('closest_attributed_ancestors').execute();
      await initializeClosestAttributedAncestorsTable(trx);
      await initializeAttributionResourceAccess(trx, false);
    });
}
