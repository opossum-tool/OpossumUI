// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import {
  getCardLabels,
  type PackageInfoForLabels,
} from '../../Frontend/util/get-card-labels';
import {
  expectReadonlyIndicator,
  getPanel,
  type PanelTestId,
  SETTLED_TIMEOUT,
} from './common';

function cardLabel(packageInfo: PackageInfoForLabels): string {
  // Production PackageCard builds `package card ${labels[0]}` from
  // getCardLabels(); reusing it keeps the helper in sync for packageInfo
  // without a packageName (URL/license/copyright fallback).
  return getCardLabels(packageInfo)[0] ?? '';
}

function cardLabelText(packageInfo: PackageInfoForLabels): string {
  return `package card ${cardLabel(packageInfo)}`;
}

function getPackageCard(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
): HTMLElement {
  return within(getPanel(panelTestId)).getByLabelText(
    cardLabelText(packageInfo),
  );
}

function queryPackageCard(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
): HTMLElement | null {
  return within(getPanel(panelTestId)).queryByLabelText(
    cardLabelText(packageInfo),
  );
}

export async function getPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
): Promise<HTMLElement> {
  const card = await getPackageCardAfterItAppears(panelTestId, packageInfo);
  return within(card).getByRole('checkbox');
}

export async function expectPackageCards(
  panelTestId: PanelTestId,
  visible: Array<PackageInfoForLabels>,
  hidden: Array<PackageInfoForLabels> = [],
): Promise<void> {
  for (const packageInfo of visible) {
    await waitFor(() => {
      expect(getPackageCard(panelTestId, packageInfo)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const packageInfo of hidden) {
    // Retried like Playwright's auto-waiting toBeHidden(): the card may still
    // be rendered while the panel refetches after a mutation or filter change,
    // so absence can only be observed on the card list itself. A card that
    // never disappears fails after SETTLED_TIMEOUT.
    await waitFor(() => {
      expectCardAbsentOrHidden(panelTestId, packageInfo);
    }, SETTLED_TIMEOUT);
  }
}

function expectCardAbsentOrHidden(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
): void {
  const card = queryPackageCard(panelTestId, packageInfo);
  if (card) {
    expect(card).not.toBeVisible();
  }
}

export async function expectPackageCardPickerSource(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
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
  packageInfo: PackageInfoForLabels,
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
  packageInfo: PackageInfoForLabels,
): Promise<void> {
  const card = await getPackageCardAfterItAppears(panelTestId, packageInfo);
  await userEvent.click(
    within(card).getByText(cardLabel(packageInfo), { exact: true }),
  );
}

async function getPackageCardByLabelAfterItAppears(
  panelTestId: PanelTestId,
  label: string,
): Promise<HTMLElement> {
  return waitFor(() => {
    const card = within(getPanel(panelTestId)).getByLabelText(
      `package card ${label}`,
    );
    expect(card).toBeVisible();
    return card;
  }, SETTLED_TIMEOUT);
}

export async function clickPackageCardByLabel(
  panelTestId: PanelTestId,
  label: string,
): Promise<void> {
  const card = await getPackageCardByLabelAfterItAppears(panelTestId, label);
  await userEvent.click(within(card).getByText(label, { exact: true }));
}

const AI_STATUS_ICON_LABEL =
  /^(AI generated|Human-modified AI|Deferred AI) icon$/;

export async function expectPackageCardAiIcons(
  panelTestId: PanelTestId,
  label: string,
  icons: Array<string>,
): Promise<void> {
  await waitFor(() => {
    const card = within(getPanel(panelTestId)).getByLabelText(
      `package card ${label}`,
    );
    expect(
      within(card)
        .queryAllByLabelText(AI_STATUS_ICON_LABEL)
        .map((icon) => icon.getAttribute('aria-label')),
    ).toEqual(icons);
  }, SETTLED_TIMEOUT);
}

export async function clickPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
): Promise<void> {
  const card = await getPackageCardAfterItAppears(panelTestId, packageInfo);
  await userEvent.click(within(card).getByRole('checkbox'));
}

export async function expectPackageCardCheckbox(
  panelTestId: PanelTestId,
  packageInfo: PackageInfoForLabels,
  checked: boolean,
): Promise<void> {
  await waitFor(() => {
    const checkbox = within(getPackageCard(panelTestId, packageInfo)).getByRole(
      'checkbox',
    );
    if (checked) {
      expect(checkbox).toBeChecked();
    } else {
      expect(checkbox).not.toBeChecked();
    }
  }, SETTLED_TIMEOUT);
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
  packageInfo: PackageInfoForLabels,
  readonly: boolean,
): Promise<void> {
  await waitFor(() => {
    const card = getPackageCard(panelTestId, packageInfo);
    expect(card).toBeVisible();
    expectReadonlyIndicator(card, readonly);
  }, SETTLED_TIMEOUT);
}
