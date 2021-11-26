// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  clickOnButton,
  expectButtonIsNotShown,
  getButton,
  getPackagePanel,
} from './general-test-helpers';
import { fireEvent, getByText, Screen } from '@testing-library/react';
import { ButtonText } from '../enums/enums';
import {
  expectReplaceAttributionPopupIsNotShown,
  expectReplaceAttributionPopupIsShown,
} from './popup-test-helpers';

export function expectGlobalOnlyContextMenuForNotPreselectedAttribution(
  screen: Screen,
  cardLabel: string,
  showReplaceMarked = false
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
    hiddenButtons
  );
}

export function expectGlobalOnlyContextMenuForPreselectedAttribution(
  screen: Screen,
  cardLabel: string
): void {
  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    [
      ButtonText.ShowResources,
      ButtonText.DeleteGlobally,
      ButtonText.ConfirmGlobally,
      ButtonText.MarkForReplacement,
    ],
    [
      ButtonText.Hide,
      ButtonText.Unhide,
      ButtonText.Delete,
      ButtonText.Confirm,
      ButtonText.UnmarkForReplacement,
      ButtonText.ReplaceMarked,
    ]
  );
}

export function expectContextMenuForNotPreSelectedAttributionMultipleResources(
  screen: Screen,
  cardLabel: string,
  showReplaceMarked = false
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
    hiddenButtons
  );
}

export function expectContextMenuForPreSelectedAttributionMultipleResources(
  screen: Screen,
  cardLabel: string
): void {
  expectCorrectButtonsInContextMenu(
    screen,
    cardLabel,
    [
      ButtonText.ShowResources,
      ButtonText.Delete,
      ButtonText.DeleteGlobally,
      ButtonText.Confirm,
      ButtonText.ConfirmGlobally,
      ButtonText.MarkForReplacement,
    ],
    [
      ButtonText.Hide,
      ButtonText.Unhide,
      ButtonText.UnmarkForReplacement,
      ButtonText.ReplaceMarked,
    ]
  );
}

export function expectContextMenuForNotPreSelectedAttributionSingleResource(
  screen: Screen,
  cardLabel: string,
  showReplaceMarked = false
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
    hiddenButtons
  );
}

export function expectContextMenuForExternalAttributionInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  expectCorrectButtonsInPackageInPackagePanelContextMenu(
    screen,
    packageName,
    packagePanelName,
    [ButtonText.ShowResources, ButtonText.Hide],
    [
      ButtonText.Unhide,
      ButtonText.Delete,
      ButtonText.DeleteGlobally,
      ButtonText.Confirm,
      ButtonText.ConfirmGlobally,
      ButtonText.UnmarkForReplacement,
      ButtonText.ReplaceMarked,
      ButtonText.MarkForReplacement,
    ]
  );
}

export function expectContextMenuForHiddenExternalAttributionInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  expectCorrectButtonsInPackageInPackagePanelContextMenu(
    screen,
    packageName,
    packagePanelName,
    [ButtonText.ShowResources, ButtonText.Unhide],
    [
      ButtonText.Hide,
      ButtonText.Delete,
      ButtonText.DeleteGlobally,
      ButtonText.Confirm,
      ButtonText.ConfirmGlobally,
      ButtonText.MarkForReplacement,
      ButtonText.ReplaceMarked,
      ButtonText.UnmarkForReplacement,
    ]
  );
}

export function testCorrectMarkAndUnmarkForReplacementInContextMenu(
  screen: Screen,
  packageName: string
): void {
  clickOnButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.MarkForReplacement
  );
  expectUnmarkForReplacementInContextMenu(screen, packageName);
  clickOnButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.UnmarkForReplacement
  );
  expectButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.MarkForReplacement
  );
}

export function expectUnmarkForReplacementInContextMenu(
  screen: Screen,
  packageName: string
): void {
  expectButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.UnmarkForReplacement
  );
  expectButtonInPackageContextMenuIsNotShown(
    screen,
    packageName,
    ButtonText.MarkForReplacement
  );
}

export function handleReplaceMarkedAttributionViaContextMenu(
  screen: Screen,
  packageName: string,
  responseButtonText: ButtonText.Cancel | ButtonText.Replace
): void {
  clickOnButtonInPackageContextMenu(
    screen,
    packageName,
    ButtonText.ReplaceMarked
  );
  expectReplaceAttributionPopupIsShown(screen);
  clickOnButton(screen, responseButtonText);
  expectReplaceAttributionPopupIsNotShown(screen);
}

export function expectContextMenuIsNotShown(
  screen: Screen,
  cardLabel: string
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);

  expectButtonInPackageContextMenuIsNotShown(
    screen,
    cardLabel,
    ButtonText.ShowResources
  );

  expectButtonInPackageContextMenuIsNotShown(
    screen,
    cardLabel,
    ButtonText.Hide
  );

  expectButtonInPackageContextMenuIsNotShown(
    screen,
    cardLabel,
    ButtonText.Delete
  );
}

export function expectNoConfirmationButtonsShown(
  screen: Screen,
  cardLabel: string
): void {
  expectButtonInPackageContextMenuIsNotShown(
    screen,
    cardLabel,
    ButtonText.Confirm
  );
  expectButtonInPackageContextMenuIsNotShown(
    screen,
    cardLabel,
    ButtonText.ConfirmGlobally
  );

  expectButtonIsNotShown(screen, ButtonText.Confirm);
  expectButtonIsNotShown(screen, ButtonText.ConfirmGlobally);
}

export function expectCorrectButtonsInContextMenu(
  screen: Screen,
  cardLabel: string,
  shownButtons: Array<ButtonText>,
  hiddenButtons: Array<ButtonText>
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
  disabled = false
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);
  const button = getButton(screen, buttonLabel);
  const buttonAttribute = button.attributes.getNamedItem('aria-disabled');

  expect(buttonAttribute && buttonAttribute.value).toBe(String(disabled));
}

function expectButtonInPackageContextMenuIsNotShown(
  screen: Screen,
  cardLabel: string,
  buttonLabel: ButtonText
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);
  expect(screen.queryByRole('button', { name: buttonLabel })).toBeFalsy();
}

export function clickOnButtonInPackageContextMenu(
  screen: Screen,
  cardLabel: string,
  buttonLabel: ButtonText
): void {
  openContextMenuOnCardPackageCard(screen, cardLabel);
  const button = getButton(screen, buttonLabel);
  fireEvent.click(screen.getByRole('presentation').firstChild as Element);

  fireEvent.click(button);
}

function openContextMenuOnCardPackageCard(
  screen: Screen,
  cardLabel: string
): void {
  fireEvent.contextMenu(screen.getByText(cardLabel) as Element);
}

export function expectCorrectButtonsInPackageInPackagePanelContextMenu(
  screen: Screen,
  packageName: string,
  packagePanelName: string,
  shownButtons: Array<ButtonText>,
  hiddenButtons: Array<ButtonText>
): void {
  shownButtons.forEach((buttonText) => {
    expectButtonInPackageInPackagePanelContextMenu(
      screen,
      packageName,
      packagePanelName,
      buttonText
    );
  });

  hiddenButtons.forEach((buttonText) => {
    expectButtonInPackageInPackagePanelContextMenuIsNotShown(
      screen,
      packageName,
      packagePanelName,
      buttonText
    );
  });
}

export function expectButtonInPackageInPackagePanelContextMenu(
  screen: Screen,
  packageName: string,
  packagePanelName: string,
  buttonLabel: ButtonText,
  disabled = false
): void {
  openContextMenuOnPackageInPackagePanel(screen, packageName, packagePanelName);
  const button = getButton(screen, buttonLabel);
  const buttonAttribute = button.attributes.getNamedItem('aria-disabled');

  expect(buttonAttribute && buttonAttribute.value).toBe(String(disabled));
}

function expectButtonInPackageInPackagePanelContextMenuIsNotShown(
  screen: Screen,
  packageName: string,
  packagePanelName: string,
  buttonLabel: ButtonText
): void {
  openContextMenuOnPackageInPackagePanel(screen, packageName, packagePanelName);
  expect(screen.queryByRole('button', { name: buttonLabel })).toBeFalsy();
}

export function clickOnButtonInPackageInPackagePanelContextMenu(
  screen: Screen,
  packageName: string,
  packagePanelName: string,
  buttonLabel: ButtonText
): void {
  openContextMenuOnPackageInPackagePanel(screen, packageName, packagePanelName);
  const button = getButton(screen, buttonLabel);
  fireEvent.click(button);
}

function openContextMenuOnPackageInPackagePanel(
  screen: Screen,
  packageName: string,
  packagePanelName: string
): void {
  const packagesPanel = getPackagePanel(screen, packagePanelName);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  fireEvent.contextMenu(getByText(packagesPanel, packageName));
}
