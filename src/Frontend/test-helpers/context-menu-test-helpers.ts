// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, Screen } from '@testing-library/react';

import { ButtonText } from '../enums/enums';
import { getButton } from './general-test-helpers';

export function expectGlobalOnlyContextMenuForNotPreselectedAttribution(
  screen: Screen,
  cardLabel: string,
  showReplaceMarked = false,
): void {
  const shownButtons = [
    ButtonText.ShowResources,
    ButtonText.DeleteGlobally,
    ButtonText.MarkForReplacement,
  ];
  const hiddenButtons = [
    ButtonText.Hide,
    ButtonText.Unhide,
    ButtonText.Delete,
    ButtonText.Confirm,
    ButtonText.ConfirmGlobally,
    ButtonText.UnmarkForReplacement,
    ButtonText.DeleteSelectedGlobally,
  ];

  if (showReplaceMarked) {
    shownButtons.push(ButtonText.ReplaceMarked);
  } else {
    hiddenButtons.push(ButtonText.ReplaceMarked);
  }

  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    shownButtons,
    hiddenButtons,
  );
}

export function expectContextMenuForNotPreSelectedAttributionMultipleResources(
  screen: Screen,
  cardLabel: string,
  showReplaceMarked = false,
): void {
  const shownButtons = [
    ButtonText.ShowResources,
    ButtonText.Delete,
    ButtonText.DeleteGlobally,
    ButtonText.MarkForReplacement,
  ];
  const hiddenButtons = [
    ButtonText.Hide,
    ButtonText.Unhide,
    ButtonText.Confirm,
    ButtonText.ConfirmGlobally,
    ButtonText.UnmarkForReplacement,
    ButtonText.DeleteSelectedGlobally,
  ];

  if (showReplaceMarked) {
    shownButtons.push(ButtonText.ReplaceMarked);
  } else {
    hiddenButtons.push(ButtonText.ReplaceMarked);
  }

  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    shownButtons,
    hiddenButtons,
  );
}

export function expectContextMenuForNotPreSelectedAttributionSingleResource(
  screen: Screen,
  cardLabel: string,
  showReplaceMarked = false,
): void {
  const shownButtons = [
    ButtonText.ShowResources,
    ButtonText.Delete,
    ButtonText.MarkForReplacement,
  ];
  const hiddenButtons = [
    ButtonText.Hide,
    ButtonText.Unhide,
    ButtonText.Confirm,
    ButtonText.ConfirmGlobally,
    ButtonText.DeleteGlobally,
    ButtonText.UnmarkForReplacement,
    ButtonText.DeleteSelectedGlobally,
  ];

  if (showReplaceMarked) {
    shownButtons.push(ButtonText.ReplaceMarked);
  } else {
    hiddenButtons.push(ButtonText.ReplaceMarked);
  }

  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    shownButtons,
    hiddenButtons,
  );
}

export function testCorrectMarkAndUnmarkForReplacementInContextMenu(
  screen: Screen,
  packageName: string,
): void {
  clickOnButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.MarkForReplacement,
  );
  expectUnmarkForReplacementInContextMenu(screen, packageName);
  clickOnButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.UnmarkForReplacement,
  );
  expectButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.MarkForReplacement,
  );
}

function expectUnmarkForReplacementInContextMenu(
  screen: Screen,
  packageName: string,
): void {
  expectButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.UnmarkForReplacement,
  );
  expectButtonInPackageContextMenuIsNotShown(
    screen,
    packageName,
    ButtonText.MarkForReplacement,
  );
}

function expectCorrectButtonsInContextMenu(
  screen: Screen,
  cardLabel: string,
  shownButtons: Array<ButtonText>,
  hiddenButtons: Array<ButtonText>,
): void {
  shownButtons.forEach((buttonText) => {
    expectButtonInPackageContextMenu(screen, cardLabel, buttonText);
  });

  hiddenButtons.forEach((buttonText) => {
    expectButtonInPackageContextMenuIsNotShown(screen, cardLabel, buttonText);
  });
}

export function expectButtonInPackageContextMenu(
  screen: Screen,
  cardLabel: string,
  buttonLabel: ButtonText,
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);
  getButton(screen, buttonLabel);
  closeContextMenuOnCardPackageCard(screen, cardLabel);
}

function expectButtonInPackageContextMenuIsNotShown(
  screen: Screen,
  cardLabel: string,
  buttonLabel: ButtonText,
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);
  expect(
    screen.queryByRole('button', { name: buttonLabel }),
  ).not.toBeInTheDocument();
  closeContextMenuOnCardPackageCard(screen, cardLabel);
}

export function clickOnButtonInPackageContextMenu(
  screen: Screen,
  cardLabel: string,
  buttonLabel: ButtonText,
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);
  const button = getButton(screen, buttonLabel);
  fireEvent.click(screen.getByRole('presentation').firstChild as Element);

  fireEvent.click(button);
}

function openContextMenuOnCardPackageCard(
  screen: Screen,
  cardLabel: string,
): void {
  fireEvent.contextMenu(screen.getByText(cardLabel) as Element);
}

function closeContextMenuOnCardPackageCard(
  screen: Screen,
  cardLabel: string,
): void {
  fireEvent.contextMenu(screen.getByText(cardLabel) as Element);
}
