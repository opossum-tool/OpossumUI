// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import type {
  Command,
  CommandParams,
  CommandReturn,
} from '../../ElectronBackend/api/commands';

// Query options for Tanstack, see https://tanstack.com/query/v5/docs/framework/react/reference/useQuery
type QueryOptions<C extends Command> = Omit<
  UseQueryOptions<Awaited<CommandReturn<C>>>,
  'queryKey' | 'queryFn'
>;

type UseQueryReturn<C extends Command> = ReturnType<
  typeof useQuery<Awaited<CommandReturn<C>>>
>;

type Params<C extends Command> =
  CommandParams<C> extends void
    ? [params?: undefined, options?: QueryOptions<C>]
    : [params: CommandParams<C>, options?: QueryOptions<C>];

type BackendClient = {
  [C in Command]: {
    useQuery: (...args: Params<C>) => UseQueryReturn<C>;
  };
};

// Can be used as backend.commandName.useQuery(params) or backend.commandName.useQuery(params, options) if the command needs parameters,
// and backend.commandName.useQuery() or backend.commandName.useQuery(undefined, options) otherwise
export const backend = new Proxy({} as BackendClient, {
  get(_, command: Command) {
    const getQueryKey = (command: Command, params: unknown) => [
      'backend',
      command,
      params,
    ];

    return {
      useQuery: (params?: unknown, options?: object) =>
        useQuery({
          queryKey: getQueryKey(command, params),
          queryFn: () =>
            window.electronAPI.api(
              command,
              params as CommandParams<typeof command>,
            ),
          ...options,
        }),
    };
  },
});
