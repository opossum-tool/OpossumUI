// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, Screen } from '@testing-library/react';

import { ButtonText } from '../enums/enums';
import { getButton } from './general-test-helpers';

export function clickOnButtonInPackageContextMenu(
  screen: Screen,
  cardLabel: string,
  buttonLabel: ButtonText,
): void {
  fireEvent.contextMenu(screen.getByText(cardLabel) as Element);
  const button = getButton(screen, buttonLabel);
  fireEvent.click(screen.getByRole('presentation').firstChild as Element);

  fireEvent.click(button);
}
