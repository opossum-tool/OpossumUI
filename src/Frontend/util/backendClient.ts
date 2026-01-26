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
    invalidate: (params?: CommandParams<C>) => Promise<void>;
    reset: (params?: CommandParams<C>) => Promise<void>;
  };
};

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
