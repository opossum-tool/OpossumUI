// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { getDb } from '../db/db';

const commands = {
  async searchResources(props: { searchString: string }) {
    const searchTerm = props.searchString.toLowerCase();
    const result = await getDb()
      .selectFrom('resource')
      .select([sql<string>`path || IF(can_have_children, '/', '')`.as('path')])
      .where(sql<boolean>`instr(LOWER(path), LOWER(${searchTerm})) > 0`)
      .execute();
    return result.map((r) => r.path);
  },
  async numberOfRessources() {
    const result = await getDb()
      .selectFrom('resource')
      .select(({ fn }) => [fn.countAll().as('count')])
      .executeTakeFirstOrThrow();
    return result.count;
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
  console.time(`Running ${command}`);
  const result = fn(params);
  console.timeEnd(`Running ${command}`);

  return result;
}
