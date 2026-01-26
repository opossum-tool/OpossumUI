// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from '../db/db';

const commands = {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} satisfies Record<string, (param?: any) => unknown>;

type Commands = typeof commands;

export type Command = keyof Commands;

export type CommandParams<C extends Command> =
  Parameters<Commands[C]> extends [infer P] ? P : void;
export type CommandReturn<C extends Command> = ReturnType<Commands[C]>;

export function executeCommand<C extends Command>(
  command: C,
  params: CommandParams<C>,
): CommandReturn<C> {
  const fn = commands[command] as unknown as (
    args: CommandParams<C>,
  ) => CommandReturn<C>;
  const result = fn(params);

  return result;
}
