// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import commitInfo from '../../../../commitInfo.json';
import { renderComponent } from '../../../test-helpers/render';
import { UpdateAppPopup } from '../UpdateAppPopup';

describe('UpdateAppPopup', () => {
  const okStatus = 200;
  const notFoundStatus = 404;
  const axiosMock = new MockAdapter(axios);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it('shows the popup with a link to a new release', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      )
      .replyOnce(okStatus, {
        name: 'Latest release',
        html_url: 'some url',
      });
    renderComponent(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Check for updates')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'There is a new release! You can download it using the following link:',
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText('Latest release')).toBeInTheDocument();
  });

  it('shows the popup with no newer release', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      )
      .replyOnce(okStatus, {
        name: commitInfo.commitInfo,
        html_url: 'some url',
      });
    renderComponent(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Check for updates')).toBeInTheDocument();
    expect(
      await screen.findByText('You have the latest version of the app.'),
    ).toBeInTheDocument();
  });

  it('shows the popup with no info found', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      )
      .replyOnce(okStatus, null);
    renderComponent(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Check for updates')).toBeInTheDocument();
    expect(
      await screen.findByText('No information found.'),
    ).toBeInTheDocument();
  });

  it('shows the popup with error', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest',
      )
      .replyOnce(notFoundStatus);
    renderComponent(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Check for updates')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Failed while fetching release data: Request failed with status code 404',
      ),
    ).toBeInTheDocument();
  });
});
