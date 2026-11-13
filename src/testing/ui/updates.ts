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

export async function expectUpdateAlertVisible(
  visible: boolean,
): Promise<void> {
  // Assert on the update banner itself (not just any role="alert") so other
  // notification banners, e.g. the mac-architecture warning, do not interfere.
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
  await waitFor(() => {
    if (visible) {
      expect(screen.getByText(message)).toBeVisible();
    } else {
      expect(screen.queryByText(message)).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function dismissUpdateAlert(): Promise<void> {
  // Click the dismiss button inside the update banner, not the first dismiss
  // button on the page: other banners (e.g. the mac-architecture warning)
  // render their own dismiss buttons.
  await userEvent.click(
    await waitFor(
      () =>
        within(screen.getByTestId(UPDATE_BANNER_TEST_ID)).getByRole('button', {
          name: text.updateApp.dismissed,
        }),
      SETTLED_TIMEOUT,
    ),
  );
}

export async function clickUpdateActionButton(name: string): Promise<void> {
  await userEvent.click(
    await screen.findByRole(
      'button',
      { name },
      { timeout: SETTLED_TIMEOUT.timeout },
    ),
  );
}

export async function expectUpdateActionButtonVisible(
  name: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const button = screen.queryByRole('button', { name });
    if (visible) {
      expect(button).not.toBeNull();
      expect(button).toBeVisible();
    } else {
      expect(button).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateDownloadLinkVisible(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const link = screen.queryByRole('link', { name: text.updateApp.download });
    if (visible) {
      expect(link).not.toBeNull();
      expect(link).toBeVisible();
    } else {
      expect(link).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateProgressbarVisible(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const progressbar = screen.queryByRole('progressbar');
    if (visible) {
      expect(progressbar).not.toBeNull();
      expect(progressbar).toBeVisible();
    } else {
      expect(progressbar).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectUpdateProgressbarShowsPercent(
  percent: number,
): Promise<void> {
  await waitFor(() => {
    expect(
      screen.getByRole('progressbar', {
        name: text.updateApp.downloading(percent),
      }),
    ).toHaveAttribute('aria-valuenow', String(percent));
  }, SETTLED_TIMEOUT);
}
