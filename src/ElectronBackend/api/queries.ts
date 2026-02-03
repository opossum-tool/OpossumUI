// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from '../db/db';
import { CommandFunction } from './commands';

export const queries = {
  /**
   * Returns the paths of resources that contain the given search string (case insensitive)
   *
   * For backwards compatibility, an / is appended to the path
   * if the resource can have children (i.e. is a directory or is included in files_with_children)
   */
  async searchResources(props: { searchString: string }) {
    const result = await getDb()
      .selectFrom('resource')
      .select([sql<string>`path || IF(can_have_children, '/', '')`.as('path')])
      .where(sql<boolean>`instr(LOWER(path), LOWER(${props.searchString})) > 0`)
      .execute();
    return result.map((r) => r.path);
  },
} satisfies Record<string, CommandFunction>;
