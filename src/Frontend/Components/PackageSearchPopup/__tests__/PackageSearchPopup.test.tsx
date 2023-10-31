// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { PackageSearchPopup } from '../PackageSearchPopup';

describe('PackageSearchPopup', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const axiosMock = new MockAdapter(axios);
  const requestURLSearchEndpoint = RegExp(
    '^https:\\/\\/api\\.clearlydefined\\.io\\/definitions\\?pattern=',
  );
  const baseURLDefinitionEndpoint =
    'https://api.clearlydefined.io/definitions/';
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const okStatus = 200;
  const notFoundStatus = 404;

  it('performs search successfully', async () => {
    axiosMock
      .onGet(requestURLSearchEndpoint)
      .replyOnce(okStatus, ['sqlalchemy/1.4.1', 'sqlalchemy/1.3.0']);

    axiosMock
      .onGet(`${baseURLDefinitionEndpoint}sqlalchemy/1.4.1`)
      .replyOnce(okStatus, {
        licensed: {
          declared: 'MIT',
          facets: {
            core: {
              attribution: {
                parties: ['Copyright Jane Doe', 'Copyright John Doe'],
              },
            },
          },
        },
        coordinates: {
          type: 'pypi',
          provider: 'pypi',
          name: 'sqlalchemy',
          revision: '1.4.1',
        },
        described: {
          urls: {
            registry: 'https://pypi.org/project/SQLAlchemy',
            version: 'https://pypi.org/project/SQLAlchemy/1.4.1',
          },
        },
      });

    axiosMock
      .onGet(`${baseURLDefinitionEndpoint}sqlalchemy/1.3.0`)
      .replyOnce(okStatus, {
        licensed: {
          declared: 'MIT',
          facets: {
            core: {
              attribution: {
                parties: ['Copyright Jane Doe', 'Copyright John Doe'],
              },
            },
          },
        },
        coordinates: {
          type: 'pypi',
          provider: 'pypi',
          name: 'sqlalchemy',
          revision: '1.3.0',
        },
        described: {
          urls: {
            registry: 'https://pypi.org/project/SQLAlchemy',
            version: 'https://pypi.org/project/SQLAlchemy/1.3.0',
          },
        },
      });

    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <PackageSearchPopup />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'sqlalchemy' },
    });

    expect(await screen.findByText('sqlalchemy/1.3.0'));
    expect(screen.getByText('sqlalchemy/1.4.1'));
    expect(screen.getAllByText('MIT')).toHaveLength(2);
  });

  it('shows an error message', async () => {
    axiosMock.onGet(requestURLSearchEndpoint).replyOnce(notFoundStatus);

    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <PackageSearchPopup />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'sqlalchemy' },
    });

    expect(
      await screen.findByText(
        'Failed while fetching data: Request failed with status code 404',
      ),
    );
  });

  it('shows a message when nothing is found', async () => {
    axiosMock.onGet(requestURLSearchEndpoint).reply(okStatus, []);

    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <PackageSearchPopup />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'sqlalchemy' },
    });

    expect(await screen.findByText('No results found'));
  });
});
