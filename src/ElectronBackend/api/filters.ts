// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  expressionBuilder,
  type OperandExpression,
  sql,
  type SqlBool,
} from 'kysely';

import {
  ATTRIBUTION_FILTER_KEYS,
  type AttributionFilterKey,
} from '../../shared/shared-constants';
import type { DB } from '../db/generated/databaseTypes';

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
function getFilters(): Record<
  AttributionFilterKey,
  OperandExpression<SqlBool>
> {
  const eb = expressionBuilder<DB, 'attribution'>();
  const filters = {
    currentlyPreferred: eb('preferred', '=', 1),
    excludedFromNotice: eb('exclude_from_notice', '=', 1),
    firstParty: eb('first_party', '=', 1),
    highConfidence: eb(
      'attribution_confidence',
      '>=',
      LOW_CONFIDENCE_THRESHOLD,
    ),
    incompleteCoordinates: eb.and([
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
    incompleteLegal: eb.and([
      eb('exclude_from_notice', '=', 0),
      eb('first_party', '=', 0),
      eb.or([
        eb('copyright', 'is', null),
        eb('copyright', '=', ''),
        eb.and([
          eb.or([eb('license_name', 'is', null), eb('license_name', '=', '')]),
          eb.or([
            eb(sql`data->>'licenseText'`, 'is', null),
            eb(sql`data->>'licenseText'`, '=', ''),
          ]),
        ]),
      ]),
    ]),
    lowConfidence: eb(
      'attribution.attribution_confidence',
      '<',
      LOW_CONFIDENCE_THRESHOLD,
    ),
    needsFollowUp: eb('follow_up', '=', 1),
    needsReview: eb('needs_review', '=', 1),
    notExcludedFromNotice: eb('exclude_from_notice', '=', 0),
    preSelected: eb('pre_selected', '=', 1),
    notPreSelected: eb('pre_selected', '=', 0),
    previouslyPreferred: eb('was_preferred', '=', 1),
    thirdParty: eb('first_party', '=', 0),
    modifiedPreferred: eb.and([
      eb('original_attribution_was_preferred', '=', 1),
      eb('was_preferred', '=', 0),
    ]),
  };

  return filters;
}

export function getFilterExpression(
  filter: AttributionFilterKey,
): OperandExpression<SqlBool> {
  return getFilters()[filter];
}

export function getFilterKeys(): ReadonlyArray<AttributionFilterKey> {
  return ATTRIBUTION_FILTER_KEYS;
}

export function getSearchExpression(
  search: string,
): OperandExpression<SqlBool> {
  const eb = expressionBuilder<DB, 'attribution'>();
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
