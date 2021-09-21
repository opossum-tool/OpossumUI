// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ButtonGroup, MainButtonConfig } from '../ButtonGroup';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { ContextMenuItem } from '../../ContextMenu/ContextMenu';
import { ButtonTitle } from '../../../enums/enums';

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

  test('renders buttons', () => {
    render(<ButtonGroup mainButtonConfigs={mainButtonConfigs} />);

    screen.getByText('Test');
    screen.getByText('Test 2');
    expect(screen.queryByText('Test 3')).toBe(null);
  });

  test('renders context menu', () => {
    const contextMenuItems: Array<ContextMenuItem> = [
      {
        buttonTitle: ButtonTitle.Save,
        disabled: false,
        onClick: doNothing,
      },
      {
        buttonTitle: ButtonTitle.SaveForAll,
        disabled: true,
        onClick: doNothing,
        hidden: true,
      },
    ];

    render(
      <ButtonGroup
        mainButtonConfigs={mainButtonConfigs}
        contextMenuButtonConfigs={contextMenuItems}
      />
    );
    fireEvent.click(screen.getByLabelText('button-context-menu'));

    screen.getByText(ButtonTitle.Save);
    expect(screen.queryByText(ButtonTitle.SaveForAll)).toBe(null);
  });
});
