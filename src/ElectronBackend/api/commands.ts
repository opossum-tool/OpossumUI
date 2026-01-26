// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getDb } from '../db/db';

const commands = {
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
  const result = fn(params);

  return result;
}
