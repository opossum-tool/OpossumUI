// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, getByText, Screen } from '@testing-library/react';

export function expectShowResourcesPopupVisible(screen: Screen): void {
  expect(getPopupWithResources(screen)).toBeTruthy();
}

export function clickOnNodeInPopupWithResources(
  screen: Screen,
  nodeLabel: string,
): void {
  const popupWithResources = getPopupWithResources(screen);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  fireEvent.click(getByText(popupWithResources, nodeLabel));
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
  expect(screen.queryByText('Warning')).not.toBeInTheDocument();
}

export function expectReplaceAttributionPopupIsShown(screen: Screen): void {
  expect(screen.getByText('This removes the following attribution'));
}

export function expectReplaceAttributionPopupIsNotShown(screen: Screen): void {
  expect(
    screen.queryByText('This removes the following attribution'),
  ).not.toBeInTheDocument();
}

export function expectErrorPopupIsShown(screen: Screen): void {
  expect(screen.getByText('Unable to save.'));
}

export function expectErrorPopupIsNotShown(screen: Screen): void {
  expect(screen.queryByText('Unable to save.')).not.toBeInTheDocument();
}

export function expectConfirmDeletionPopupVisible(screen: Screen): void {
  expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
}

export function expectConfirmDeletionPopupNotVisible(screen: Screen): void {
  expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
}

export function expectConfirmMultiSelectDeletionPopupVisible(
  screen: Screen,
  numberOfSelectedAttributions: number,
): void {
  expect(
    screen.getByText(
      `Do you really want to delete the selected attributions for all files? This action will delete ${numberOfSelectedAttributions} attributions.`,
    ),
  ).toBeInTheDocument();
}

export function expectConfirmMultiSelectDeletionPopupNotVisible(
  screen: Screen,
): void {
  expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
}

export function mockResizeObserver(): void {
  const originalResizeObserver = window.ResizeObserver;

  beforeEach(() => {
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    jest.restoreAllMocks();
  });
}
