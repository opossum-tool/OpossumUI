// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { getCardLabels } from '../../../Frontend/util/get-card-labels';
import type { RawPackageInfo } from '../../../shared/shared-types';
import {
  expectReadonlyIndicator,
  getPanel,
  type PanelTestId,
  SETTLED_TIMEOUT,
} from './common';

function cardLabel(packageInfo: RawPackageInfo): string {
  // Production PackageCard builds `package card ${labels[0]}` from
  // getCardLabels(); reusing it keeps the helper in sync for packageInfo
  // without a packageName (URL/license/copyright fallback).
  return getCardLabels(packageInfo)[0] ?? '';
}

function cardLabelText(packageInfo: RawPackageInfo): string {
  return `package card ${cardLabel(packageInfo)}`;
}

function getPackageCard(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): HTMLElement {
  return within(getPanel(panelTestId)).getByLabelText(
    cardLabelText(packageInfo),
  );
}

function getPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): HTMLElement {
  return within(getPackageCard(panelTestId, packageInfo)).getByRole('checkbox');
}

export async function expectPackageCards(
  panelTestId: PanelTestId,
  visible: Array<RawPackageInfo>,
  hidden: Array<RawPackageInfo> = [],
): Promise<void> {
  for (const packageInfo of visible) {
    await waitFor(() => {
      expect(getPackageCard(panelTestId, packageInfo)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const packageInfo of hidden) {
    await waitFor(() => {
      expectCardAbsentOrHidden(panelTestId, packageInfo);
    }, SETTLED_TIMEOUT);
  }
}

function expectCardAbsentOrHidden(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): void {
  const card = within(getPanel(panelTestId)).queryByLabelText(
    cardLabelText(packageInfo),
  );
  if (card) {
    expect(card).not.toBeVisible();
  }
}

export async function expectPackageCardPickerSource(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
  isPickerSource: boolean,
): Promise<void> {
  await waitFor(() => {
    const card = getPackageCard(panelTestId, packageInfo);
    if (isPickerSource) {
      expect(card).toHaveAttribute('data-picker-source', 'true');
    } else {
      expect(card.getAttribute('data-picker-source')).not.toBe('true');
    }
  }, SETTLED_TIMEOUT);
}

async function getPackageCardAfterItAppears(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): Promise<HTMLElement> {
  // Playwright auto-waits for the card to attach after mounting; mirror that
  // here since callers click cards right after renderApp.
  return waitFor(() => {
    const card = getPackageCard(panelTestId, packageInfo);
    expect(card).toBeVisible();
    return card;
  }, SETTLED_TIMEOUT);
}

export async function clickPackageCard(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): Promise<void> {
  const card = await getPackageCardAfterItAppears(panelTestId, packageInfo);
  await userEvent.click(
    within(card).getByText(cardLabel(packageInfo), { exact: true }),
  );
}

export async function clickPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
): Promise<void> {
  const card = await getPackageCardAfterItAppears(panelTestId, packageInfo);
  await userEvent.click(within(card).getByRole('checkbox'));
}

export async function expectPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
  checked: boolean,
): Promise<void> {
  const assertion = checked ? jestExpectChecked : jestExpectUnchecked;
  await waitFor(() => {
    assertion(getPackageCardCheckbox(panelTestId, packageInfo));
  }, SETTLED_TIMEOUT);
}

function jestExpectChecked(checkbox: HTMLElement): void {
  expect(checkbox).toBeChecked();
}

function jestExpectUnchecked(checkbox: HTMLElement): void {
  expect(checkbox).not.toBeChecked();
}

export async function clickSelectAllCheckbox(
  panelTestId: PanelTestId,
): Promise<void> {
  await userEvent.click(
    within(getPanel(panelTestId)).getByRole('checkbox', {
      name: /select all/i,
    }),
  );
}

export async function expectPackageCardPartition(
  panelTestId: PanelTestId,
  packageInfo: RawPackageInfo,
  readonly: boolean,
): Promise<void> {
  await waitFor(() => {
    const card = getPackageCard(panelTestId, packageInfo);
    expect(card).toBeVisible();
    expectReadonlyIndicator(card, readonly);
  }, SETTLED_TIMEOUT);
}
