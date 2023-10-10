// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ButtonGroup, MainButtonConfig } from '../ButtonGroup';
import { fireEvent, render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { ButtonText } from '../../../enums/enums';
import { ContextMenuItem } from '../../ContextMenu/ContextMenu';

describe('Button group', () => {
  const mainButtonConfigs: Array<MainButtonConfig> = [
    {
      buttonText: 'Test',
      disabled: false,
      onClick: doNothing,
      hidden: false,
    },
    {
      buttonText: 'Test 2',
      disabled: true,
      onClick: doNothing,
      hidden: false,
    },
    {
      buttonText: 'Test 3',
      disabled: true,
      onClick: doNothing,
      hidden: true,
    },
  ];

  it('renders buttons', () => {
    render(<ButtonGroup mainButtonConfigs={mainButtonConfigs} />);

    screen.getByText('Test');
    screen.getByText('Test 2');
    expect(screen.queryByText('Test 3')).not.toBeInTheDocument();
  });

  it('renders context menu', () => {
    const contextMenuItems: Array<ContextMenuItem> = [
      {
        buttonText: ButtonText.Save,
        disabled: false,
        onClick: doNothing,
      },
      {
        buttonText: ButtonText.SaveGlobally,
        disabled: true,
        onClick: doNothing,
        hidden: true,
      },
    ];

    render(
      <ButtonGroup
        mainButtonConfigs={mainButtonConfigs}
        hamburgerMenuButtonConfigs={contextMenuItems}
      />,
    );
    fireEvent.click(screen.getByLabelText('button-hamburger-menu'));

    screen.getByText(ButtonText.Save);
    expect(screen.queryByText(ButtonText.SaveGlobally)).not.toBeInTheDocument();
  });
});
