// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, queryByText, Screen } from '@testing-library/react';

export function insertValueIntoTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string,
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  fireEvent.change(textBox, {
    target: { value },
  });
}

export function expectValueInTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string,
): void {
  const textBox = screen.getByLabelText(textBoxLabel);

  expect(textBox).toHaveValue(value);
}

export function expectValueNotInTextBox(
  screen: Screen,
  textBoxLabel: string,
  value: string,
): void {
  const textBox = screen.getByLabelText(textBoxLabel);
  // eslint-disable-next-line testing-library/prefer-screen-queries
  expect(queryByText(textBox, value)).not.toBeInTheDocument();
}

function getGoToLinkIcon(screen: Screen, label: string): HTMLElement {
  return screen.getByLabelText(label);
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
