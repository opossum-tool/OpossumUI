// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react';

import { NotificationPopup } from '../NotificationPopup';

describe('NotificationPopup', () => {
  it('renders open popup with text', () => {
    const onLeftButtonClick = jest.fn();
    const onRightButtonClick = jest.fn();
    const onCenterLeftButtonClick = jest.fn();
    const onCenterRightButtonClick = jest.fn();

    render(
      <NotificationPopup
        header={'header text'}
        leftButtonConfig={{
          onClick: onLeftButtonClick,
          buttonText: 'leftButtonText',
        }}
        rightButtonConfig={{
          onClick: onRightButtonClick,
          buttonText: 'rightButtonText',
        }}
        centerLeftButtonConfig={{
          onClick: onCenterLeftButtonClick,
          buttonText: 'centerLeftButtonText',
        }}
        centerRightButtonConfig={{
          onClick: onCenterRightButtonClick,
          buttonText: 'centerRightButtonText',
        }}
        isOpen={true}
      >
        content text
      </NotificationPopup>,
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

  it('renders open popup with component', () => {
    render(
      <NotificationPopup header={'header text'} isOpen={true}>
        <div>test component</div>
      </NotificationPopup>,
    );

    expect(screen.getByText('header text')).toBeInTheDocument();
    expect(screen.getByText('test component')).toBeInTheDocument();
  });

  it('executes function on escape key', () => {
    const onEscapeKeyDown = jest.fn();
    render(
      <NotificationPopup
        header={'header text'}
        isOpen={true}
        onEscapeKeyDown={onEscapeKeyDown}
      >
        <div>{'test component'}</div>
      </NotificationPopup>,
    );

    fireEvent.keyDown(screen.getByText('test component'), {
      key: 'Escape',
      code: 'Escape',
    });
    expect(onEscapeKeyDown).toHaveBeenCalled();
  });
});
