// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiDialog from '@material-ui/core/Dialog';
import MuiDialogActions from '@material-ui/core/DialogActions';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogContentText from '@material-ui/core/DialogContentText';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import React, { ReactElement, useEffect } from 'react';
import { Button } from '../Button/Button';
import { doNothing } from '../../util/do-nothing';

interface NotificationPopupProps {
  header: string;
  content: ReactElement | string;
  leftButtonTitle?: string;
  centerLeftButtonTitle?: string;
  centerRightButtonTitle?: string;
  rightButtonTitle?: string;
  isLeftButtonDisabled?: boolean;
  isCenterLeftButtonDisabled?: boolean;
  isCenterRightButtonDisabled?: boolean;
  isRightButtonDisabled?: boolean;
  onLeftButtonClick?(): void;
  onCenterLeftButtonClick?(): void;
  onCenterRightButtonClick?(): void;
  onRightButtonClick?(): void;
  onBackdropClick?(): void;
  onEscapeKeyDown?(): void;
  isOpen: boolean;
  fullWidth?: boolean;
  headerClassname?: string;
}

export function NotificationPopup(props: NotificationPopupProps): ReactElement {
  const onEscapeKeyDown = props.onEscapeKeyDown
    ? props.onEscapeKeyDown
    : doNothing;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onEscapeKeyDown();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return (): void => window.removeEventListener('keydown', onKeyDown);
  }, [onEscapeKeyDown]);

  function handleOnClose(event: unknown, reason: string): void {
    switch (reason) {
      case 'backdropClick':
        if (props.onBackdropClick) {
          props.onBackdropClick();
        }
        break;
    }
  }

  return (
    <MuiDialog
      fullWidth={props.fullWidth}
      maxWidth={'xl'}
      open={props.isOpen}
      disableEscapeKeyDown={true}
      onClose={handleOnClose}
    >
      <MuiDialogTitle classes={{ root: props.headerClassname }}>
        {props.header}
      </MuiDialogTitle>
      <MuiDialogContent>
        {typeof props.content === 'string' ? (
          <MuiDialogContentText>{props.content}</MuiDialogContentText>
        ) : (
          props.content
        )}
      </MuiDialogContent>
      <MuiDialogActions>
        {props.leftButtonTitle && props.onLeftButtonClick ? (
          <Button
            buttonText={props.leftButtonTitle}
            onClick={props.onLeftButtonClick}
            isDark={true}
            disabled={props.isLeftButtonDisabled}
          />
        ) : null}
        {props.centerLeftButtonTitle && props.onCenterLeftButtonClick ? (
          <Button
            buttonText={props.centerLeftButtonTitle}
            onClick={props.onCenterLeftButtonClick}
            isDark={false}
            disabled={props.isCenterLeftButtonDisabled}
          />
        ) : null}
        {props.centerRightButtonTitle && props.onCenterRightButtonClick ? (
          <Button
            buttonText={props.centerRightButtonTitle}
            onClick={props.onCenterRightButtonClick}
            isDark={false}
            disabled={props.isCenterRightButtonDisabled}
          />
        ) : null}
        {props.rightButtonTitle && props.onRightButtonClick ? (
          <Button
            buttonText={props.rightButtonTitle}
            onClick={props.onRightButtonClick}
            isDark={false}
            disabled={props.isRightButtonDisabled}
          />
        ) : null}
      </MuiDialogActions>
    </MuiDialog>
  );
}
