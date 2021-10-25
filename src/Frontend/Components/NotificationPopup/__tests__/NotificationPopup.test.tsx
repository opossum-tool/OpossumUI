// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { NotificationPopup } from '../NotificationPopup';

describe('NotificationPopup', () => {
  test('renders open popup with text', () => {
    const onLeftButtonClick = jest.fn();
    const onRightButtonClick = jest.fn();
    const onCenterLeftButtonClick = jest.fn();
    const onCenterRightButtonClick = jest.fn();

    render(
      <NotificationPopup
        content={'content text'}
        header={'header text'}
        leftButtonText={'leftButtonText'}
        onLeftButtonClick={onLeftButtonClick}
        rightButtonText={'rightButtonText'}
        onRightButtonClick={onRightButtonClick}
        centerLeftButtonText={'centerLeftButtonText'}
        onCenterLeftButtonClick={onCenterLeftButtonClick}
        centerRightButtonText={'centerRightButtonText'}
        onCenterRightButtonClick={onCenterRightButtonClick}
        isOpen={true}
      />
    );

    expect(screen.getByText('header text')).toBeTruthy();
    expect(screen.getByText('content text')).toBeTruthy();

    fireEvent.click(screen.getByText('leftButtonText'));
    expect(onLeftButtonClick).toHaveBeenCalled();
    fireEvent.click(screen.getByText('rightButtonText'));
    expect(onRightButtonClick).toHaveBeenCalled();
    fireEvent.click(screen.getByText('centerLeftButtonText'));
    expect(onCenterLeftButtonClick).toHaveBeenCalled();
    fireEvent.click(screen.getByText('centerRightButtonText'));
    expect(onCenterRightButtonClick).toHaveBeenCalled();
  });

  test('renders open popup with component', () => {
    render(
      <NotificationPopup
        content={<div>{'test component'}</div>}
        header={'header text'}
        isOpen={true}
      />
    );

    expect(screen.getByText('header text')).toBeTruthy();
    expect(screen.getByText('test component')).toBeTruthy();
  });

  test('executes function on escape key', () => {
    const onEscapeKeyDown = jest.fn();
    render(
      <NotificationPopup
        content={<div>{'test component'}</div>}
        header={'header text'}
        isOpen={true}
        onEscapeKeyDown={onEscapeKeyDown}
      />
    );

    fireEvent.keyDown(screen.getByText('test component'), {
      key: 'Escape',
      code: 'Escape',
    });
    expect(onEscapeKeyDown).toHaveBeenCalled();
  });
});
