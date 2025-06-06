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
  leftButtonConfig?: ButtonProps & { buttonText: string };
  rightButtonConfig?: ButtonProps & { buttonText: string };
  centerLeftButtonConfig?: ButtonProps & { buttonText: string };
  centerRightButtonConfig?: ButtonProps & { buttonText: string };
  onBackdropClick?(): void;
  onEscapeKeyDown?(): void;
  isOpen: boolean;
  fullWidth?: boolean;
  sx?: SxProps;
  'aria-label'?: string;
  customAction?: React.ReactNode;
  background?: keyof typeof OpossumColors;
  width?: React.CSSProperties['width'];
  height?: React.CSSProperties['height'];
  minWidth?: React.CSSProperties['minWidth'];
  maxWidth?: React.CSSProperties['maxWidth'];
  className?: string;
}

export function NotificationPopup(
  props: React.PropsWithChildren<NotificationPopupProps>,
) {
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
      slotProps={{
        paper: {
          sx: {
            ...(props.width && { width: props.width }),
            ...(props.height && { height: props.height }),
            ...(props.minWidth && { minWidth: props.minWidth }),
            ...(props.maxWidth && { maxWidth: props.maxWidth }),
            ...(props.background && {
              background: OpossumColors[props.background],
            }),
          },
        },
      }}
      aria-label={props['aria-label']}
    >
      <MuiDialogTitle>{props.header}</MuiDialogTitle>
      <MuiDialogContent className={props.className} sx={props.sx}>
        {typeof props.children === 'string' ? (
          <MuiDialogContentText>{props.children}</MuiDialogContentText>
        ) : (
          props.children
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
            loading={props.leftButtonConfig.loading}
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
            loading={props.centerLeftButtonConfig.loading}
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
            loading={props.centerRightButtonConfig.loading}
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
            loading={props.rightButtonConfig.loading}
          >
            {props.rightButtonConfig.buttonText}
          </MuiButton>
        ) : null}
      </MuiDialogActions>
    </MuiDialog>
  );
}
