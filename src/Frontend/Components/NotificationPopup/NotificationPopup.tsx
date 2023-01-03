// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiDialog from '@mui/material/Dialog';
import MuiDialogActions from '@mui/material/DialogActions';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogContentText from '@mui/material/DialogContentText';
import MuiDialogTitle from '@mui/material/DialogTitle';
import React, { ReactElement, useEffect } from 'react';
import { Button } from '../Button/Button';
import { doNothing } from '../../util/do-nothing';
import { ButtonConfig } from '../../types/types';
import { SxProps } from '@mui/material';
import { POPUP_MAX_WIDTH_BREAKPOINT } from '../../shared-styles';

interface NotificationPopupProps {
  header: string;
  content: ReactElement | string;
  leftButtonConfig?: ButtonConfig;
  rightButtonConfig?: ButtonConfig;
  centerLeftButtonConfig?: ButtonConfig;
  centerRightButtonConfig?: ButtonConfig;
  onBackdropClick?(): void;
  onEscapeKeyDown?(): void;
  isOpen: boolean;
  fullWidth?: boolean;
  headerSx?: SxProps;
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
      maxWidth={POPUP_MAX_WIDTH_BREAKPOINT}
      open={props.isOpen}
      disableEscapeKeyDown={true}
      onClose={handleOnClose}
    >
      <MuiDialogTitle
        sx={{ '&.MuiDialogTitle-root': props.headerSx } as SxProps}
      >
        {props.header}
      </MuiDialogTitle>
      <MuiDialogContent style={{ paddingTop: '5px' }}>
        {typeof props.content === 'string' ? (
          <MuiDialogContentText>{props.content}</MuiDialogContentText>
        ) : (
          props.content
        )}
      </MuiDialogContent>
      <MuiDialogActions>
        {props.leftButtonConfig ? (
          <Button
            buttonText={props.leftButtonConfig.buttonText}
            onClick={props.leftButtonConfig.onClick}
            isDark={Boolean(props.leftButtonConfig?.isDark)}
            disabled={props.leftButtonConfig.disabled}
            tooltipText={props.leftButtonConfig?.tooltipText ?? ''}
            tooltipPlacement={props.leftButtonConfig?.tooltipPlacement}
          />
        ) : null}
        {props.centerLeftButtonConfig ? (
          <Button
            buttonText={props.centerLeftButtonConfig.buttonText}
            onClick={props.centerLeftButtonConfig.onClick}
            isDark={Boolean(props.centerLeftButtonConfig?.isDark)}
            disabled={props.centerLeftButtonConfig.disabled}
            tooltipText={props.centerLeftButtonConfig?.tooltipText ?? ''}
            tooltipPlacement={props.centerLeftButtonConfig?.tooltipPlacement}
          />
        ) : null}
        {props.centerRightButtonConfig ? (
          <Button
            buttonText={props.centerRightButtonConfig.buttonText}
            onClick={props.centerRightButtonConfig.onClick}
            isDark={Boolean(props.centerRightButtonConfig?.isDark)}
            disabled={props.centerRightButtonConfig.disabled}
            tooltipText={props.centerRightButtonConfig?.tooltipText ?? ''}
            tooltipPlacement={props.centerRightButtonConfig?.tooltipPlacement}
          />
        ) : null}
        {props.rightButtonConfig ? (
          <Button
            buttonText={props.rightButtonConfig.buttonText}
            onClick={props.rightButtonConfig.onClick}
            isDark={Boolean(props.rightButtonConfig?.isDark)}
            disabled={props.rightButtonConfig.disabled}
            tooltipText={props.rightButtonConfig?.tooltipText ?? ''}
            tooltipPlacement={props.rightButtonConfig?.tooltipPlacement}
          />
        ) : null}
      </MuiDialogActions>
    </MuiDialog>
  );
}
