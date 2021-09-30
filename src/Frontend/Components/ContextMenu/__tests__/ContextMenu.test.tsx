// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ContextMenu, ContextMenuItem } from '../ContextMenu';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { ButtonText } from '../../../enums/enums';

describe('The ContextMenu', () => {
  test('renders and handles click', () => {
    const onClickMock = jest.fn();
    const menuItems: Array<ContextMenuItem> = [
      {
        buttonText: ButtonText.Undo,
        disabled: true,
        onClick: doNothing,
      },
      {
        buttonText: ButtonText.Save,
        disabled: false,
        onClick: onClickMock,
      },
      {
        buttonText: ButtonText.SaveForAll,
        disabled: false,
        onClick: doNothing,
        hidden: true,
      },
    ];
    render(<ContextMenu menuItems={menuItems} />);

    expect(screen.getByText(ButtonText.Undo));
    expect(screen.getByText(ButtonText.Save));
    expect(screen.queryByText(ButtonText.SaveForAll)).toBe(null);

    const buttonDisabledAttribute = screen
      .getByLabelText('button-context-menu')
      .attributes.getNamedItem('disabled');

    expect(buttonDisabledAttribute).toBeFalsy();

    fireEvent.click(screen.getByText(ButtonText.Save));

    expect(onClickMock).toBeCalled();
  });

  test('is disabled if no enabled button present', () => {
    const menuItems: Array<ContextMenuItem> = [
      {
        buttonText: ButtonText.Undo,
        disabled: true,
        onClick: doNothing,
      },
      {
        buttonText: ButtonText.SaveForAll,
        disabled: false,
        onClick: doNothing,
        hidden: true,
      },
    ];
    render(<ContextMenu menuItems={menuItems} />);

    const buttonDisabledAttribute = screen
      .getByLabelText('button-context-menu')
      .attributes.getNamedItem('disabled');

    expect(buttonDisabledAttribute).toBeTruthy();
  });
});
