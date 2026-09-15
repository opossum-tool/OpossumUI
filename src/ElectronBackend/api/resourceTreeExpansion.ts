// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SqlBool, Transaction } from 'kysely';

import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import {
  getMatchesFiltersExpression,
  getVisibleWithFiltersExpression,
  hasActiveFilters,
  type ResourceTreeFilters,
  withFilteredResourcesTable,
} from './resourceTreeFilters';
import { GET_LEGACY_RESOURCE_PATH, removeTrailingSlash } from './utils';

type ExpansionNode = {
  id: number;
  can_have_children: number;
  inherited_match: SqlBool;
  path: string;
};

async function getStartingNode(
  trx: Transaction<DB>,
  fromNodePath: string,
  filters: ResourceTreeFilters,
): Promise<ExpansionNode | undefined> {
  return trx
    .selectFrom('resource as r')
    .select(['r.id', 'r.path', 'r.can_have_children'])
    .select((eb) =>
      eb
        .exists((eb) =>
          eb
            .selectFrom('resource as ancestor')
            .selectAll()
            .whereRef('ancestor.id', '<=', 'r.id')
            .whereRef('ancestor.max_descendant_id', '>=', 'r.id')
            .where('ancestor.path', '!=', '')
            .where((eb) =>
              getMatchesFiltersExpression({
                id: eb.ref('ancestor.id'),
                path: eb.ref('ancestor.path'),
                name: eb.ref('ancestor.name'),
                filters,
              }),
            ),
        )
        .as('inherited_match'),
    )
    .where('r.path', '=', removeTrailingSlash(fromNodePath))
    .executeTakeFirst();
}

async function getVisibleChildren(
  trx: Transaction<DB>,
  parent: ExpansionNode,
  filters: ResourceTreeFilters,
) {
  const inheritedMatch = Boolean(parent.inherited_match);
  const childrenQuery = trx
    .selectFrom('resource as child')
    .select(['child.id', 'child.path', 'child.can_have_children'])
    .where('child.parent_id', '=', parent.id)
    .where((eb) =>
      getVisibleWithFiltersExpression({
        id: eb.ref('child.id'),
        maxDescendantId: eb.ref('child.max_descendant_id'),
        isReadonly: eb.ref('child.is_readonly'),
        inheritedMatch: eb.val<0 | 1>(inheritedMatch ? 1 : 0),
        filters,
      }),
    )
    .orderBy('child.id')
    .limit(2);

  return childrenQuery
    .select((eb) =>
      (inheritedMatch
        ? eb.val<0 | 1>(1)
        : getMatchesFiltersExpression({
            id: eb.ref('child.id'),
            path: eb.ref('child.path'),
            name: eb.ref('child.name'),
            filters,
          })
      ).as('inherited_match'),
    )
    .execute();
}

async function getFilteredNodePathsToExpand(
  trx: Transaction<DB>,
  fromNodePath: string,
  filters: ResourceTreeFilters,
): Promise<{ result: Array<string> }> {
  let node = await getStartingNode(trx, fromNodePath, filters);
  if (!node) {
    return { result: [] };
  }

  const paths = [node.path + (node.can_have_children ? '/' : '')];

  while (node.can_have_children) {
    const children = await getVisibleChildren(trx, node, filters);
    if (children.length !== 1 || !children[0].can_have_children) {
      break;
    }

    const child = children[0];
    paths.push(`${child.path}/`);
    node = child;
  }

  return { result: paths };
}

export async function getNodePathsToExpand({
  fromNodePath,
  ...filters
}: { fromNodePath: string } & ResourceTreeFilters): Promise<{
  result: Array<string>;
}> {
  if (hasActiveFilters(filters)) {
    return withFilteredResourcesTable(filters, (trx) =>
      getFilteredNodePathsToExpand(trx, fromNodePath, filters),
    );
  }

  const nodesToExpand = await getDb()
    .withRecursive('nodes', (eb) =>
      eb
        .selectFrom('resource')
        .select(['id', GET_LEGACY_RESOURCE_PATH])
        .where('path', '=', removeTrailingSlash(fromNodePath))
        .unionAll(
          eb
            .selectFrom('resource')
            .innerJoin('nodes', 'resource.parent_id', 'nodes.id')
            .select(['resource.id', GET_LEGACY_RESOURCE_PATH])
            .where('resource.can_have_children', '=', 1)
            .where((eb) =>
              eb(
                eb
                  .selectFrom('resource as child')
                  .select((eb) => eb.fn.countAll<number>().as('count'))
                  .whereRef('child.parent_id', '=', 'nodes.id'),
                '=',
                1,
              ),
            ),
        ),
    )
    .selectFrom('nodes')
    .select('path')
    .execute();

  return { result: nodesToExpand.map((node) => node.path) };
}
