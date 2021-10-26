// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ContextMenuButton } from '../ContextMenuButton';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { ButtonText } from '../../../enums/enums';
import { ContextMenuItem } from '../../ContextMenu/ContextMenu';

describe('The ContextMenuButton', () => {
  test('is disabled if no enabled button present', () => {
    const menuItems: Array<ContextMenuItem> = [
      {
        buttonText: ButtonText.Undo,
        disabled: true,
        onClick: doNothing,
      },
      {
        buttonText: ButtonText.SaveGlobally,
        disabled: false,
        onClick: doNothing,
        hidden: true,
      },
    ];
    render(<ContextMenuButton menuItems={menuItems} />);

    const buttonDisabledAttribute = screen
      .getByLabelText('button-context-menu')
      .attributes.getNamedItem('disabled');

    expect(buttonDisabledAttribute).toBeTruthy();
  });
});
