// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, getByText, Screen } from '@testing-library/react';

import { getPackagePanel } from './general-test-helpers';

export function expectPackageInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string,
): void {
  const packagesPanel = getPackagePanel(screen, packagePanelName);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(getByText(packagesPanel, packageName)).toBeInTheDocument();
}

export function clickOnTab(screen: Screen, tabLabel: string): void {
  fireEvent.click(screen.getByLabelText(tabLabel));
}
