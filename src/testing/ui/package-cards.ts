// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  getCardLabels,
  type PackageInfoForLabels,
} from '../../Frontend/util/get-card-labels';

export const SETTLED_TIMEOUT = { timeout: 5000 } as const;

function packageCardLabel(packageInfo: PackageInfoForLabels): string {
  // Production PackageCard builds `package card ${labels[0]}` from
  // getCardLabels(); reusing it keeps the helper in sync for packageInfo
  // without a packageName (URL/license/copyright fallback).
  return `package card ${getCardLabels(packageInfo)[0] ?? ''}`;
}

function findPackageCard(
  packageInfo: PackageInfoForLabels,
): Promise<HTMLElement> {
  return screen.findByLabelText(
    packageCardLabel(packageInfo),
    {},
    SETTLED_TIMEOUT,
  );
}

export async function clickPackageCard(
  packageInfo: PackageInfoForLabels,
): Promise<void> {
  const card = await findPackageCard(packageInfo);
  await userEvent.click(
    within(card).getByText(getCardLabels(packageInfo)[0] ?? '', {
      exact: true,
    }),
  );
}

export async function getPackageCardCheckbox(
  packageInfo: PackageInfoForLabels,
): Promise<HTMLElement> {
  return within(await findPackageCard(packageInfo)).getByRole('checkbox');
}

export async function clickPackageCardCheckbox(
  packageInfo: PackageInfoForLabels,
): Promise<void> {
  await userEvent.click(await getPackageCardCheckbox(packageInfo));
}
