// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogActions from '@mui/material/DialogActions';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogContentText from '@mui/material/DialogContentText';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { noop } from 'lodash';
import { ReactElement } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { OpossumColors } from '../../shared-styles';
import { Button, ButtonProps } from '../Button/Button';

interface NotificationPopupProps {
  header: string;
  content: ReactElement | string;
  leftButtonConfig?: ButtonProps;
  rightButtonConfig?: ButtonProps;
  centerLeftButtonConfig?: ButtonProps;
  centerRightButtonConfig?: ButtonProps;
  onBackdropClick?(): void;
  onEscapeKeyDown?(): void;
  isOpen: boolean;
  fullWidth?: boolean;
  headerSx?: SxProps;
  contentSx?: SxProps;
  'aria-label'?: string;
  customAction?: ReactElement;
  background?: keyof typeof OpossumColors;
  width?: number;
}

export function NotificationPopup(props: NotificationPopupProps): ReactElement {
  useHotkeys('esc', props.onEscapeKeyDown || noop, [props.onEscapeKeyDown]);

  return (
    <MuiDialog
      fullWidth={props.fullWidth}
      maxWidth={'xl'}
      open={props.isOpen}
      disableEscapeKeyDown={true}
      onClose={(_, reason) =>
        reason === 'backdropClick' && props.onBackdropClick?.()
      }
      PaperProps={{
        sx: {
          ...(props.width && { width: props.width }),
          ...(props.background && {
            background: OpossumColors[props.background],
          }),
        },
      }}
      aria-label={props['aria-label']}
    >
      <MuiDialogTitle
        sx={{ '&.MuiDialogTitle-root': props.headerSx } as SxProps}
      >
        {props.header}
      </MuiDialogTitle>
      <MuiDialogContent sx={props.contentSx}>
        {typeof props.content === 'string' ? (
          <MuiDialogContentText>{props.content}</MuiDialogContentText>
        ) : (
          props.content
        )}
      </MuiDialogContent>
      <MuiDialogActions>
        {props.customAction}
        {props.leftButtonConfig ? (
          <Button
            buttonText={props.leftButtonConfig.buttonText}
            onClick={props.leftButtonConfig.onClick}
            color={props.leftButtonConfig.color}
            disabled={props.leftButtonConfig.disabled}
            tooltipText={props.leftButtonConfig.tooltipText ?? ''}
            tooltipPlacement={props.leftButtonConfig.tooltipPlacement}
          />
        ) : null}
        {props.centerLeftButtonConfig ? (
          <Button
            buttonText={props.centerLeftButtonConfig.buttonText}
            onClick={props.centerLeftButtonConfig.onClick}
            color={props.centerLeftButtonConfig.color}
            disabled={props.centerLeftButtonConfig.disabled}
            tooltipText={props.centerLeftButtonConfig.tooltipText ?? ''}
            tooltipPlacement={props.centerLeftButtonConfig.tooltipPlacement}
          />
        ) : null}
        {props.centerRightButtonConfig ? (
          <Button
            buttonText={props.centerRightButtonConfig.buttonText}
            onClick={props.centerRightButtonConfig.onClick}
            color={props.centerRightButtonConfig.color}
            disabled={props.centerRightButtonConfig.disabled}
            tooltipText={props.centerRightButtonConfig.tooltipText ?? ''}
            tooltipPlacement={props.centerRightButtonConfig.tooltipPlacement}
          />
        ) : null}
        {props.rightButtonConfig ? (
          <Button
            buttonText={props.rightButtonConfig.buttonText}
            onClick={props.rightButtonConfig.onClick}
            color={props.rightButtonConfig.color}
            disabled={props.rightButtonConfig.disabled}
            tooltipText={props.rightButtonConfig.tooltipText ?? ''}
            tooltipPlacement={props.rightButtonConfig.tooltipPlacement}
          />
        ) : null}
      </MuiDialogActions>
    </MuiDialog>
  );
}
