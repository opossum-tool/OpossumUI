// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SqlBool, Transaction } from 'kysely';

import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import { withFilteredResourcesTable } from './resource-tree-cache';
import {
  getMatchesFiltersExpression,
  getVisibleWithFiltersExpression,
  hasActiveFilters,
  type ResourceTreeFilters,
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
  cacheId: number,
): Promise<ExpansionNode | undefined> {
  return trx
    .withRecursive('ancestors', (eb) =>
      eb
        .selectFrom('resource as r')
        .select([
          'r.id',
          'r.parent_id',
          'r.path',
          'r.name',
          'r.can_have_children',
        ])
        .where('r.path', '=', removeTrailingSlash(fromNodePath))
        .unionAll((eb) =>
          eb
            .selectFrom('resource as parent')
            .innerJoin('ancestors as child', 'child.parent_id', 'parent.id')
            .select([
              'parent.id',
              'parent.parent_id',
              'parent.path',
              'parent.name',
              'parent.can_have_children',
            ]),
        ),
    )
    .selectFrom('ancestors as r')
    .select(['r.id', 'r.path', 'r.can_have_children'])
    .select((eb) =>
      eb
        .exists((eb) =>
          eb
            .selectFrom('ancestors as ancestor')
            .selectAll()
            .where('ancestor.path', '!=', '')
            .where((eb) =>
              getMatchesFiltersExpression({
                id: eb.ref('ancestor.id'),
                path: eb.ref('ancestor.path'),
                name: eb.ref('ancestor.name'),
                filters,
                cacheId,
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
  cacheId: number,
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
        cacheId,
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
            cacheId,
          })
      ).as('inherited_match'),
    )
    .execute();
}

async function getFilteredNodePathsToExpand(
  trx: Transaction<DB>,
  fromNodePath: string,
  filters: ResourceTreeFilters,
  cacheId: number,
): Promise<{ result: Array<string> }> {
  let node = await getStartingNode(trx, fromNodePath, filters, cacheId);
  if (!node) {
    return { result: [] };
  }

  const paths = [node.path + (node.can_have_children ? '/' : '')];

  while (node.can_have_children) {
    const children = await getVisibleChildren(trx, node, filters, cacheId);
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
    return withFilteredResourcesTable(filters, (trx, cacheId) =>
      getFilteredNodePathsToExpand(trx, fromNodePath, filters, cacheId),
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
