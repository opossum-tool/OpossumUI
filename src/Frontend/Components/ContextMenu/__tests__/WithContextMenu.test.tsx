// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonText } from '../../../enums/enums';
import { doNothing } from '../../../util/do-nothing';
import { ContextMenuItem, WithContextMenu } from '../WithContextMenu';

const onClickMock = jest.fn();
const testMenuItems: Array<ContextMenuItem> = [
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
    buttonText: ButtonText.SaveGlobally,
    disabled: false,
    onClick: doNothing,
    hidden: true,
  },
];

function testContextMenuIsNotShown(): void {
  expect(screen.queryByText(ButtonText.Undo)).toBeFalsy();
  expect(screen.queryByText(ButtonText.Save)).toBeFalsy();
  expect(screen.queryByText(ButtonText.SaveGlobally)).toBeFalsy();
}

function testContextMenuIsShown(): void {
  expect(screen.getByText(ButtonText.Undo));
  expect(screen.getByText(ButtonText.Save));
  expect(screen.queryByText(ButtonText.SaveGlobally)).toBe(null);
}

describe('The ContextMenu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders and handles left clicks correctly', () => {
    const testElementText = 'Test Element';
    render(
      <WithContextMenu menuItems={testMenuItems} activation={'onLeftClick'}>
        <p>{testElementText}</p>
      </WithContextMenu>
    );

    testContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    testContextMenuIsNotShown();

    fireEvent.click(screen.getByText(testElementText));
    testContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));

    expect(onClickMock).toBeCalled();
  });

  test('renders and handles right clicks correctly', () => {
    const testElementText = 'Test Element';
    render(
      <WithContextMenu menuItems={testMenuItems} activation={'onRightClick'}>
        <p>{testElementText}</p>
      </WithContextMenu>
    );

    testContextMenuIsNotShown();

    fireEvent.click(screen.getByText(testElementText));
    testContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    testContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));

    expect(onClickMock).toBeCalled();
  });

  test('renders and handles left clicks correctly for both activated', () => {
    const testElementText = 'Test Element';
    render(
      <WithContextMenu menuItems={testMenuItems} activation={'both'}>
        <p>{testElementText}</p>
      </WithContextMenu>
    );

    testContextMenuIsNotShown();

    fireEvent.click(screen.getByText(testElementText));
    testContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));
    expect(onClickMock).toBeCalled();
  });

  test('renders and handles right clicks correctly for both activated', () => {
    const testElementText = 'Test Element';
    render(
      <WithContextMenu menuItems={testMenuItems} activation={'both'}>
        <p>{testElementText}</p>
      </WithContextMenu>
    );

    testContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    testContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));
    expect(onClickMock).toBeCalled();
  });
});
