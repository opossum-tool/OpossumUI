// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiButton, { ButtonProps } from '@mui/material/Button';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogActions from '@mui/material/DialogActions';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogContentText from '@mui/material/DialogContentText';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { noop } from 'lodash';
import { useHotkeys } from 'react-hotkeys-hook';

import { OpossumColors } from '../../shared-styles';

interface NotificationPopupProps {
  header: string;
  content: React.ReactNode;
  leftButtonConfig?: ButtonProps & { buttonText: string };
  rightButtonConfig?: ButtonProps & { buttonText: string };
  centerLeftButtonConfig?: ButtonProps & { buttonText: string };
  centerRightButtonConfig?: ButtonProps & { buttonText: string };
  onBackdropClick?(): void;
  onEscapeKeyDown?(): void;
  isOpen: boolean;
  fullWidth?: boolean;
  headerSx?: SxProps;
  contentSx?: SxProps;
  'aria-label'?: string;
  customAction?: React.ReactNode;
  background?: keyof typeof OpossumColors;
  width?: number;
}

export function NotificationPopup(props: NotificationPopupProps) {
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
          <MuiButton
            variant={'contained'}
            onClick={props.leftButtonConfig.onClick}
            color={props.leftButtonConfig.color}
            disabled={props.leftButtonConfig.disabled}
          >
            {props.leftButtonConfig.buttonText}
          </MuiButton>
        ) : null}
        {props.centerLeftButtonConfig ? (
          <MuiButton
            variant={'contained'}
            onClick={props.centerLeftButtonConfig.onClick}
            color={props.centerLeftButtonConfig.color}
            disabled={props.centerLeftButtonConfig.disabled}
          >
            {props.centerLeftButtonConfig.buttonText}
          </MuiButton>
        ) : null}
        {props.centerRightButtonConfig ? (
          <MuiButton
            variant={'contained'}
            onClick={props.centerRightButtonConfig.onClick}
            color={props.centerRightButtonConfig.color}
            disabled={props.centerRightButtonConfig.disabled}
          >
            {props.centerRightButtonConfig.buttonText}
          </MuiButton>
        ) : null}
        {props.rightButtonConfig ? (
          <MuiButton
            variant={'contained'}
            onClick={props.rightButtonConfig.onClick}
            color={props.rightButtonConfig.color}
            disabled={props.rightButtonConfig.disabled}
          >
            {props.rightButtonConfig.buttonText}
          </MuiButton>
        ) : null}
      </MuiDialogActions>
    </MuiDialog>
  );
}
