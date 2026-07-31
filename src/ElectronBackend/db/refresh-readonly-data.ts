// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from './db';
import {
  initializeAttributionResourceAccess,
  initializeClosestAttributedAncestorsTable,
} from './initializeDb';

export async function refreshReadonlyData() {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await sql`
        WITH RECURSIVE resource_readonly(id, is_readonly) AS (
          SELECT r.id, COALESCE(rule.readonly, 0)
          FROM resource AS r
          LEFT JOIN readonly_rule AS rule ON rule.path = '/'
          WHERE r.path = ''

          UNION ALL

          SELECT child.id, COALESCE(rule.readonly, parent.is_readonly)
          FROM resource AS child
          INNER JOIN resource_readonly AS parent ON parent.id = child.parent_id
          LEFT JOIN readonly_rule AS rule ON rule.path = child.path
        )
        UPDATE resource
        SET is_readonly = (
          SELECT is_readonly
          FROM resource_readonly
          WHERE resource_readonly.id = resource.id
        )
      `.execute(trx);

      await sql`
        UPDATE resource AS parent
        SET has_editable_descendant = EXISTS (
          SELECT 1
          FROM resource AS descendant
          WHERE descendant.id BETWEEN parent.id AND parent.max_descendant_id
            AND descendant.is_readonly = 0
        )
      `.execute(trx);

      await trx.schema.dropTable('closest_attributed_ancestors').execute();
      await initializeClosestAttributedAncestorsTable(trx);
      await initializeAttributionResourceAccess(trx, false);
    });
}
