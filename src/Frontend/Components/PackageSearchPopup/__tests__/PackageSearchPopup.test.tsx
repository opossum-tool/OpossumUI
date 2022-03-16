// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { PackageSearchPopup } from '../PackageSearchPopup';
import { act, fireEvent, screen } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from 'react-query';

describe('PackageSearchPopup', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const axiosMock = new MockAdapter(axios);
  const requestURLSearchEndpoint = RegExp(
    '^https:\\/\\/api\\.clearlydefined\\.io\\/definitions\\?pattern='
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

  it('performs search successfully', async () => {
    axiosMock.onGet(requestURLSearchEndpoint).replyOnce(200, []);
    axiosMock
      .onGet(requestURLSearchEndpoint)
      .replyOnce(200, ['sqlalchemy/1.4.1', 'sqlalchemy/1.3.0']);

    axiosMock
      .onGet(`${baseURLDefinitionEndpoint}sqlalchemy/1.4.1`)
      .replyOnce(200, {
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
      .replyOnce(200, {
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
      </QueryClientProvider>
    );
    const searchField = screen.getByLabelText('Search');
    fireEvent.change(searchField, { target: { value: 'sqlalchemy' } });
    act(() => {
      // advance timer as form is debounced
      jest.advanceTimersByTime(500);
    });

    expect(await screen.findByText('sqlalchemy/1.3.0'));
    expect(screen.getByText('sqlalchemy/1.4.1'));
    expect(screen.getAllByText('MIT')).toHaveLength(2);
  });

  it('shows an error message', async () => {
    // suppress output to console
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axiosMock.onGet(requestURLSearchEndpoint).replyOnce(200, []);
    axiosMock.onGet(requestURLSearchEndpoint).replyOnce(404);

    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <PackageSearchPopup />
      </QueryClientProvider>
    );

    const searchField = screen.getByLabelText('Search');
    fireEvent.change(searchField, { target: { value: 'sqlalchemy' } });
    act(() => {
      // advance timer as form is debounced
      jest.advanceTimersByTime(500);
    });

    expect(
      await screen.findByText(
        'Failed while fetching data: Request failed with status code 404'
      )
    );
  });

  it('shows a message when nothing is found', async () => {
    axiosMock.onGet(requestURLSearchEndpoint).reply(200, []);

    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <PackageSearchPopup />
      </QueryClientProvider>
    );

    const searchField = screen.getByLabelText('Search');
    fireEvent.change(searchField, { target: { value: 'sqlalchemy' } });
    act(() => {
      // advance timer as form is debounced
      jest.advanceTimersByTime(500);
    });

    expect(await screen.findByText('No results found'));
  });
});
