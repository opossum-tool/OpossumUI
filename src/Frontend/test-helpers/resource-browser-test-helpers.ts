// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, getByText, Screen } from '@testing-library/react';

export function collapseFolderByClickingOnIcon(
  screen: Screen,
  resourceId: string,
): void {
  fireEvent.click(screen.getByLabelText(`collapse ${resourceId}`) as Element);
}

export function getElementInResourceBrowser(
  screen: Screen,
  resourceId: string,
): HTMLElement {
  const resourceBrowser = screen.getByLabelText('resource browser');

  // eslint-disable-next-line testing-library/prefer-screen-queries
  return getByText(resourceBrowser, resourceId);
}

export function clickOnElementInResourceBrowser(
  screen: Screen,
  resourceId: string,
): void {
  fireEvent.click(getElementInResourceBrowser(screen, resourceId));
}

export function expectResourceBrowserIsNotShown(screen: Screen): void {
  expect(screen.queryByText('/')).not.toBeInTheDocument();
}
