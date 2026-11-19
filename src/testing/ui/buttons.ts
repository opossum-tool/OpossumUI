// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

import { SETTLED_TIMEOUT } from './common';

export function getButton(name: string): HTMLElement {
  return screen.getByRole('button', { name });
}

export function expectButtonDisabled(name: string): void {
  expect(getButton(name)).toBeDisabled();
}

export function expectButtonEnabled(name: string): void {
  expect(getButton(name)).toBeEnabled();
}

export function expectButtonsDisabled(...names: Array<string>): void {
  for (const name of names) {
    expectButtonDisabled(name);
  }
}

export function expectButtonsEnabled(...names: Array<string>): void {
  for (const name of names) {
    expectButtonEnabled(name);
  }
}

export async function expectEventuallyButtonDisabled(
  name: string,
): Promise<void> {
  await waitFor(() => expect(getButton(name)).toBeDisabled(), SETTLED_TIMEOUT);
}

export async function expectEventuallyButtonEnabled(
  name: string,
): Promise<void> {
  await waitFor(() => expect(getButton(name)).toBeEnabled(), SETTLED_TIMEOUT);
}

export async function expectButtonInTheDocument(
  name: string,
  present: boolean,
): Promise<void> {
  await waitFor(() => {
    if (present) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    } else {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  }, SETTLED_TIMEOUT);
}
