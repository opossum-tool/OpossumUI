// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../shared/text';
import { SETTLED_TIMEOUT } from './common';

export async function expectUpdateAlertVisible(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const alert = screen.queryByRole('alert');
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

export async function dismissUpdateAlert(index = 0): Promise<void> {
  await userEvent.click(
    screen.getAllByRole('button', { name: text.updateApp.dismissed })[index],
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

export async function expectUpdateProgressbarVisible(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByRole('progressbar')).toBeVisible();
  }, SETTLED_TIMEOUT);
}
