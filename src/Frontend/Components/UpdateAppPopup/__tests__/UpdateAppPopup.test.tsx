// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { UpdateAppPopup } from '../UpdateAppPopup';
import { screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import commitInfo from '../../../../commitInfo.json';

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
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest'
      )
      .replyOnce(okStatus, {
        name: 'Latest release',
        html_url: 'some url',
      });
    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>
    );
    expect(screen.getByText('Check for updates'));
    expect(
      await screen.findByText(
        'There is a new release! You can download it using the following link:'
      )
    );
    expect(await screen.findByText('Latest release'));
  });

  it('shows the popup with no newer release', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest'
      )
      .replyOnce(okStatus, {
        name: commitInfo.commitInfo,
        html_url: 'some url',
      });
    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>
    );
    expect(screen.getByText('Check for updates'));
    expect(await screen.findByText('You have the latest version of the app.'));
  });

  it('shows the popup with no info found', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest'
      )
      .replyOnce(okStatus, null);
    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>
    );
    expect(screen.getByText('Check for updates'));
    expect(await screen.findByText('No information found.'));
  });

  it('shows the popup with error', async () => {
    axiosMock
      .onGet(
        'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest'
      )
      .replyOnce(notFoundStatus);
    renderComponentWithStore(
      <QueryClientProvider client={queryClient}>
        <UpdateAppPopup />
      </QueryClientProvider>
    );
    expect(screen.getByText('Check for updates'));
    expect(
      await screen.findByText(
        'Failed while fetching release data: Request failed with status code 404'
      )
    );
  });
});
