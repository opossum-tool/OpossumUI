// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { NotificationPopup } from '../NotificationPopup';
import { ButtonConfig } from '../../../types/types';

describe('NotificationPopup', () => {
  test('renders open popup with text', () => {
    const onLeftButtonClick = jest.fn();
    const onRightButtonClick = jest.fn();
    const onCenterLeftButtonClick = jest.fn();
    const onCenterRightButtonClick = jest.fn();

    const leftButtonConfig: ButtonConfig = {
      onClick: onLeftButtonClick,
      buttonText: 'leftButtonText',
    };
    const rightButtonConfig: ButtonConfig = {
      onClick: onRightButtonClick,
      buttonText: 'rightButtonText',
    };
    const centerLeftButtonConfig: ButtonConfig = {
      onClick: onCenterLeftButtonClick,
      buttonText: 'centerLeftButtonText',
    };
    const centerRightButtonConfig: ButtonConfig = {
      onClick: onCenterRightButtonClick,
      buttonText: 'centerRightButtonText',
    };
    render(
      <NotificationPopup
        content={'content text'}
        header={'header text'}
        leftButtonConfig={leftButtonConfig}
        rightButtonConfig={rightButtonConfig}
        centerLeftButtonConfig={centerLeftButtonConfig}
        centerRightButtonConfig={centerRightButtonConfig}
        isOpen={true}
      />
    );

    expect(screen.getByText('header text')).toBeInTheDocument();
    expect(screen.getByText('content text')).toBeInTheDocument();

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

    expect(screen.getByText('header text')).toBeInTheDocument();
    expect(screen.getByText('test component')).toBeInTheDocument();
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
