// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../shared/text';
import { SETTLED_TIMEOUT } from './common';

const UPDATE_BANNER_TEST_ID = 'update-banner';

// All helpers here assert on elements inside the update banner, so other
// banners (e.g. the mac-architecture warning) or unrelated progress
// indicators cannot interfere. getBanner() throws when the banner is not
// rendered, so ...NotShown helpers cannot pass while the banner itself is
// gone; use expectUpdateBannerRemoved() to assert on dismissal instead.
function getBanner(): HTMLElement {
  return screen.getByTestId(UPDATE_BANNER_TEST_ID);
}

export async function expectUpdateBannerRemoved(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByTestId(UPDATE_BANNER_TEST_ID)).not.toBeInTheDocument();
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateAlertShown(): Promise<void> {
  await waitFor(() => {
    expect(getBanner()).toHaveAttribute('role', 'alert');
    expect(getBanner()).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateMessageShown(message: string): Promise<void> {
  await waitFor(() => {
    expect(within(getBanner()).getByText(message)).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateMessageNotShown(
  message: string,
): Promise<void> {
  await waitFor(() => {
    expect(within(getBanner()).queryByText(message)).not.toBeInTheDocument();
  }, SETTLED_TIMEOUT);
}

export async function dismissUpdateAlert(): Promise<void> {
  await userEvent.click(
    await waitFor(
      () =>
        within(getBanner()).getByRole('button', {
          name: text.updateApp.dismissed,
        }),
      SETTLED_TIMEOUT,
    ),
  );
}

export async function clickUpdateActionButton(name: string): Promise<void> {
  const button = await waitFor(
    () => within(getBanner()).getByRole('button', { name }),
    SETTLED_TIMEOUT,
  );
  await userEvent.click(button);
}

export async function expectUpdateActionButtonShown(
  name: string,
): Promise<void> {
  await waitFor(() => {
    expect(within(getBanner()).getByRole('button', { name })).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateDownloadLinkShown(): Promise<void> {
  await waitFor(() => {
    expect(
      within(getBanner()).getByRole('link', { name: text.updateApp.download }),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateDownloadLinkNotShown(): Promise<void> {
  await waitFor(() => {
    expect(
      within(getBanner()).queryByRole('link', {
        name: text.updateApp.download,
      }),
    ).not.toBeInTheDocument();
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateProgressbarShown(): Promise<void> {
  await waitFor(() => {
    expect(within(getBanner()).getByRole('progressbar')).toBeVisible();
  }, SETTLED_TIMEOUT);
}
