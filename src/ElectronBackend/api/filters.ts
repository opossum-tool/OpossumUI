// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExpressionBuilder, OperandExpression, SqlBool } from 'kysely';

import { Filter } from '../../Frontend/shared-constants';
import { text } from '../../shared/text';
import { DB } from '../db/generated/databaseTypes';

const LOW_CONFIDENCE_THRESHOLD = 60;

const TYPES_REQUIRING_NAMESPACE = [
  'bitbucket',
  'composer',
  'deb',
  'github',
  'gitlab',
  'maven',
];

/**
 * Return a kysely expression that is 1 if a column in the table
 * matches the expression, 0 else
 */
export function getFilterExpression(
  eb: ExpressionBuilder<DB, 'attribution'>,
  filter: Filter,
): OperandExpression<SqlBool> {
  const filters = {
    [text.filters.currentlyPreferred]: eb('preferred', '=', 1),
    [text.filters.excludedFromNotice]: eb('exclude_from_notice', '=', 1),
    [text.filters.firstParty]: eb('first_party', '=', 1),
    [text.filters.highConfidence]: eb(
      'attribution_confidence',
      '>=',
      LOW_CONFIDENCE_THRESHOLD,
    ),
    [text.filters.incompleteCoordinates]: eb.and([
      eb('exclude_from_notice', '=', 0),
      eb('first_party', '=', 0),
      eb.or([
        eb('url', 'is', null),
        eb('url', '=', ''),
        eb('package_name', 'is', null),
        eb('package_name', '=', ''),
        eb('package_type', 'is', null),
        eb('package_type', '=', ''),
        eb.and([
          eb('package_type', 'in', TYPES_REQUIRING_NAMESPACE),
          eb.or([
            eb('package_namespace', 'is', null),
            eb('package_namespace', '=', ''),
          ]),
        ]),
      ]),
    ]),
    [text.filters.incompleteLegal]: eb.and([
      eb('exclude_from_notice', '=', 0),
      eb('first_party', '=', 0),
      eb.or([
        eb('copyright', 'is', null),
        eb('copyright', '=', ''),
        eb('license_name', 'is', null),
        eb('license_name', '=', ''),
      ]),
    ]),
    [text.filters.lowConfidence]: eb(
      'attribution.attribution_confidence',
      '<',
      LOW_CONFIDENCE_THRESHOLD,
    ),
    [text.filters.needsFollowUp]: eb('follow_up', '=', 1),
    [text.filters.needsReview]: eb('needs_review', '=', 1),
    [text.filters.notExcludedFromNotice]: eb('exclude_from_notice', '=', 0),
    [text.filters.preSelected]: eb('pre_selected', '=', 1),
    [text.filters.notPreSelected]: eb('pre_selected', '=', 0),
    [text.filters.previouslyPreferred]: eb('was_preferred', '=', 1),
    [text.filters.thirdParty]: eb('first_party', '=', 0),
    [text.filters.modifiedPreferred]: eb.and([
      eb('original_attribution_was_preferred', '=', 1),
      eb('was_preferred', '=', 0),
    ]),
  } satisfies Record<Filter, OperandExpression<SqlBool>>;

  return filters[filter];
}

export function getSearchExpression(
  eb: ExpressionBuilder<DB, 'attribution'>,
  search: string,
): OperandExpression<SqlBool> {
  return eb.or(
    (
      [
        'copyright',
        'comment',
        'package_name',
        'package_namespace',
        'package_version',
      ] as const
    ).map((term) => eb(term, 'like', `%${search}%`)),
  );
}
