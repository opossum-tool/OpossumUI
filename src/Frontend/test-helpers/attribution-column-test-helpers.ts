// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  fireEvent,
  getByText,
  queryByText,
  Screen,
  within,
} from '@testing-library/react';
import { ButtonText } from '../enums/enums';
import { getButton } from './general-test-helpers';

function getButtonInHamburgerMenu(
  screen: Screen,
  buttonLabel: ButtonText
): HTMLElement {
  fireEvent.click(screen.getByLabelText('button-hamburger-menu'));
  const button = getButton(screen, buttonLabel);
  fireEvent.click(screen.getByRole('presentation').firstChild as Element);

  return button;
}

export function clickOnButtonInHamburgerMenu(
  screen: Screen,
  buttonLabel: ButtonText
): void {
  fireEvent.click(getButtonInHamburgerMenu(screen, buttonLabel));
}

export function expectButtonInHamburgerMenu(
  screen: Screen,
  buttonLabel: ButtonText,
  disabled?: boolean
): void {
  const button = getButtonInHamburgerMenu(screen, buttonLabel);
  const buttonAttribute = button.attributes.getNamedItem('aria-disabled');

  if (disabled) {
    expect(buttonAttribute && buttonAttribute.value).toBe('true');
  } else {
    expect(buttonAttribute).toBe(null);
  }
}

export function expectButtonInHamburgerMenuIsNotShown(
  screen: Screen,
  buttonLabel: ButtonText
): void {
  fireEvent.click(screen.getByLabelText('button-hamburger-menu'));
  expect(
    screen.queryByRole('button', { name: buttonLabel })
  ).not.toBeInTheDocument();

  if (screen.queryByRole('presentation')) {
    fireEvent.click(screen.getByRole('presentation').firstChild as Element);
  }
}

export function insertValueIntoTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  fireEvent.change(textBox, {
    target: { value },
  });
}

export function expectValueInConfidenceField(
  screen: Screen,
  value: string
): void {
  const numberBox = screen.getByLabelText('Confidence');
  // eslint-disable-next-line testing-library/prefer-screen-queries
  getByText(numberBox, value);
}

export function expectValueNotInConfidenceField(
  screen: Screen,
  value: string
): void {
  const numberBox = screen.getByLabelText('Confidence');
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(queryByText(numberBox, value)).not.toBeInTheDocument();
}

export function expectValueInTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(textBox).toHaveValue(value);
}

export function expectValueNotInTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(queryByText(textBox, value)).not.toBeInTheDocument();
}

export function selectConfidenceInDropdown(
  screen: Screen,
  value: string
): void {
  expect(screen.queryByText(value)).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByLabelText('Confidence'));
  const listbox = within(screen.getByRole('listbox'));
  fireEvent.click(listbox.getByText(value));
}

function getGoToLinkIcon(screen: Screen, label: string): HTMLElement {
  return screen.getByLabelText(label);
}

export function expectGoToLinkIconIsVisible(screen: Screen): void {
  expect(getGoToLinkIcon(screen, 'link to open').parentElement).toBeVisible();
}

export function expectGoToLinkIconIsNotVisible(screen: Screen): void {
  expect(
    getGoToLinkIcon(screen, 'link to open').parentElement
  ).not.toBeVisible();
}

export function clickGoToLinkIcon(screen: Screen, label: string): void {
  fireEvent.click(getGoToLinkIcon(screen, label));
}

function getGoToLinkButton(screen: Screen, label: string): HTMLElement {
  return getGoToLinkIcon(screen, label).parentElement as HTMLElement;
}

export function expectGoToLinkButtonIsDisabled(screen: Screen): void {
  const button = getGoToLinkButton(screen, 'Url icon');
  const buttonDisabledAttribute = button.attributes.getNamedItem('disabled');
  expect(buttonDisabledAttribute).toBeTruthy();
}
