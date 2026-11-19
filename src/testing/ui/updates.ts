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
// indicators cannot interfere.
function getBanner(): HTMLElement {
  return screen.getByTestId(UPDATE_BANNER_TEST_ID);
}

function queryInBanner(
  query: (banner: HTMLElement) => HTMLElement | null,
): HTMLElement | null {
  const banner = screen.queryByTestId(UPDATE_BANNER_TEST_ID);
  if (!banner) {
    return null;
  }
  return query(banner);
}

async function expectQueryInBanner(
  query: (banner: HTMLElement) => HTMLElement | null,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const element = queryInBanner(query);
    if (visible) {
      expect(element).not.toBeNull();
      expect(element).toBeVisible();
    } else {
      expect(element).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateAlertVisible(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const alert = screen.queryByTestId(UPDATE_BANNER_TEST_ID);
    if (visible) {
      expect(alert).not.toBeNull();
      expect(alert).toBeVisible();
    } else {
      expect(alert).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateMessage(
  message: string,
  visible: boolean,
): Promise<void> {
  await expectQueryInBanner(
    (banner) => within(banner).queryByText(message),
    visible,
  );
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

export async function expectUpdateActionButtonVisible(
  name: string,
  visible: boolean,
): Promise<void> {
  await expectQueryInBanner(
    (banner) => within(banner).queryByRole('button', { name }),
    visible,
  );
}

export async function expectUpdateDownloadLinkVisible(
  visible: boolean,
): Promise<void> {
  await expectQueryInBanner(
    (banner) =>
      within(banner).queryByRole('link', { name: text.updateApp.download }),
    visible,
  );
}

export async function expectUpdateProgressbarVisible(
  visible: boolean,
): Promise<void> {
  await expectQueryInBanner(
    (banner) => within(banner).queryByRole('progressbar'),
    visible,
  );
}

export async function expectUpdateProgressbarShowsPercent(
  percent: number,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getBanner()).getByRole('progressbar', {
        name: text.updateApp.downloading(percent),
      }),
    ).toHaveAttribute('aria-valuenow', String(percent));
  }, SETTLED_TIMEOUT);
}
