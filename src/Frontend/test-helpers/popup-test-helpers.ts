// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, getByText, Screen } from '@testing-library/react';

export function expectShowResourcesPopupVisible(screen: Screen): void {
  expect(getPopupWithResources(screen)).toBeTruthy();
}

export function clickOnPathInPopupWithResources(
  screen: Screen,
  path: string
): void {
  const popupWithResources = getPopupWithResources(screen);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  fireEvent.click(getByText(popupWithResources, path));
}

function getPopupWithResources(screen: Screen): HTMLElement {
  return (screen.getByText(/Resources for /).parentElement as HTMLElement)
    .parentElement as HTMLElement;
}

export function expectUnsavedChangesPopupIsShown(screen: Screen): void {
  expect(screen.getByText('Warning'));
  expect(screen.getByText('There are unsaved changes.'));
}

export function expectUnsavedChangesPopupIsNotShown(screen: Screen): void {
  expect(screen.queryByText('Warning')).toBeNull();
}

export function expectReplaceAttributionPopupIsShown(screen: Screen): void {
  expect(screen.getByText('This removes the following attribution'));
}

export function expectReplaceAttributionPopupIsNotShown(screen: Screen): void {
  expect(
    screen.queryByText('This removes the following attribution')
  ).toBeFalsy();
}

export function expectErrorPopupIsShown(screen: Screen): void {
  expect(screen.getByText('Unable to save.'));
}

export function expectErrorPopupIsNotShown(screen: Screen): void {
  expect(screen.queryByText('Unable to save.')).toBeFalsy();
}

export function expectConfirmDeletionPopupVisible(screen: Screen): void {
  expect(screen.getByText('Confirm Deletion')).toBeTruthy();
}

export function expectConfirmDeletionPopupNotVisible(screen: Screen): void {
  expect(screen.queryByText('Confirm Deletion')).toBeFalsy();
}

export function expectConfirmMultiSelectDeletionPopupVisible(
  screen: Screen,
  numberOfSelectedAttributions: number
): void {
  expect(
    screen.getByText(
      `Do you really want to delete the selected attributions for all files? This action will delete ${numberOfSelectedAttributions} attributions.`
    )
  ).toBeTruthy();
}

export function expectConfirmMultiSelectDeletionPopupNotVisible(
  screen: Screen
): void {
  expect(screen.queryByText('Confirm Deletion')).toBeFalsy();
}
