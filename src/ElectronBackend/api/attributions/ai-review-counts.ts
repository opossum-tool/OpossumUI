// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AI_REVIEW_FILTERS,
  type AiReviewCounts,
} from '../../../shared/ai-review';
import type { AttributionResultSetCriteria } from '../../../shared/attribution-result-set';
import { getAiReviewFilterExpression } from '../../db/attribution-ai';
import { getDb } from '../../db/db';
import {
  getAttributionResultSetContext,
  getFilteredQuery,
} from './attribution-list-query-utils';

export async function getAiReviewCounts(
  props: Omit<AttributionResultSetCriteria, 'aiReviewFilter'> & {
    includeReadonly: boolean;
  },
): Promise<{ result: AiReviewCounts }> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const criteria = {
        ...props,
        external: false,
        aiOnly: true,
        aiReviewFilter: undefined,
      };
      const { resource, closestAncestor } =
        await getAttributionResultSetContext(trx, criteria);
      return getFilteredQuery(
        trx,
        criteria,
        resource,
        closestAncestor,
        false,
        false,
      )
        .clearSelect()
        .select((eb) =>
          AI_REVIEW_FILTERS.map((filter) =>
            eb.fn
              .countAll<number>()
              .filterWhere(getAiReviewFilterExpression(eb, filter))
              .as(filter),
          ),
        )
        .executeTakeFirstOrThrow();
    });
  return { result };
}
