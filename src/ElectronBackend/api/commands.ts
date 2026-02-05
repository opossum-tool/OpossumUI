// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  MutationName,
  MutationParams,
  MutationResult,
  MutationReturn,
  mutations,
} from './mutations';
import {
  queries,
  QueryName,
  QueryParams,
  QueryResult,
  QueryReturn,
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

export function executeCommand<C extends CommandName>(
  command: C,
  params: CommandParams<C>,
): CommandReturn<C> {
  const fn = commands[command] as unknown as (
    args: CommandParams<C>,
  ) => CommandReturn<C>;
  return fn(params);
}
