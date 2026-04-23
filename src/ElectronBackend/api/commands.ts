// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type MutationName,
  type MutationParams,
  type MutationResult,
  type MutationReturn,
  mutations,
} from './mutations';
import {
  queries,
  type QueryName,
  type QueryParams,
  type QueryResult,
  type QueryReturn,
} from './queries';

const commands = {
  ...queries,
  ...mutations,
};

export type CommandName = QueryName | MutationName;

export type CommandParams<C extends CommandName> = C extends QueryName
  ? QueryParams<C>
  : C extends MutationName
    ? MutationParams<C>
    : never;

export type CommandReturn<C extends CommandName> = C extends QueryName
  ? QueryReturn<C>
  : C extends MutationName
    ? MutationReturn<C>
    : never;

export type CommandResult<C extends CommandName> = C extends QueryName
  ? QueryResult<C>
  : C extends MutationName
    ? MutationResult<C>
    : never;

const commandStats: Record<
  string,
  { executionCount: number; totalDuration: number }
> = {};

export async function executeCommand<C extends CommandName>(
  command: C,
  params: CommandParams<C>,
): Promise<CommandReturn<C>> {
  const fn = commands[command] as unknown as (
    args: CommandParams<C>,
  ) => CommandReturn<C>;

  console.log(command);
  const before = Date.now();
  const result = await fn(params);
  const after = Date.now();

  console.log(command, after - before);

  const stat = commandStats[command] ?? { executionCount: 0, totalDuration: 0 };

  commandStats[command] = {
    executionCount: stat.executionCount + 1,
    totalDuration: stat.totalDuration + after - before,
  };

  const maxLength = Math.max(...Object.keys(commandStats).map((k) => k.length));
  for (const [commandName, commandStatistics] of Object.entries(commandStats)) {
    console.log(
      `${`${commandName}:`.padEnd(maxLength + 2)} ${commandStatistics.executionCount.toString().padStart(3)}x ${commandStatistics.totalDuration.toString().padStart(6)} ms (avg ${(commandStatistics.totalDuration / commandStatistics.executionCount).toFixed(0).padStart(5)} ms)`,
    );
  }

  return result;
}
