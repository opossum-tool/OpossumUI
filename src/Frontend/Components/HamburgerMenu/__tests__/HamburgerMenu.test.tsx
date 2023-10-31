// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';

import { ButtonText } from '../../../enums/enums';
import { doNothing } from '../../../util/do-nothing';
import { ContextMenuItem } from '../../ContextMenu/ContextMenu';
import { HamburgerMenu } from '../HamburgerMenu';

describe('The HamburgerMenu', () => {
  it('is disabled if no enabled button present', () => {
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
    render(<HamburgerMenu menuItems={menuItems} />);

    const buttonDisabledAttribute = screen
      .getByLabelText('button-hamburger-menu')
      .attributes.getNamedItem('disabled');

    expect(buttonDisabledAttribute).toBeTruthy();
  });
});
