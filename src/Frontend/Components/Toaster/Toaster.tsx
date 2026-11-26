// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable no-restricted-imports */
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material';
import {
  resolveValue,
  Toaster as RHTToaster,
  ToastBar,
  type ToastType,
} from 'react-hot-toast';

const icons: Record<ToastType, React.ReactNode> = {
  error: <ErrorIcon color={'error'} />,
  success: <CheckCircleIcon color={'success'} />,
  loading: null,
  blank: <InfoIcon color={'info'} />,
  custom: null,
};

const ToastContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
  minWidth: 0,
}));

const ToastIconContainer = styled('div')({
  display: 'flex',
  alignSelf: 'flex-start',
  flex: '0 0 auto',
});

const ToastMessageContainer = styled('div')(({ theme }) => ({
  ...theme.typography.body1,
  flex: '1 1 auto',
  minWidth: 0,
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere',
}));

export function Toaster() {
  return (
    <RHTToaster
      toastOptions={{
        success: { duration: 3000 },
        blank: { duration: 3000 },
        error: { duration: 5000 },
      }}
    >
      {(toast) => (
        <ToastBar toast={toast}>
          {() => (
            <ToastContainer>
              {icons[toast.type] && (
                <ToastIconContainer>{icons[toast.type]}</ToastIconContainer>
              )}
              <ToastMessageContainer {...toast.ariaProps}>
                {resolveValue(toast.message, toast)}
              </ToastMessageContainer>
            </ToastContainer>
          )}
        </ToastBar>
      )}
    </RHTToaster>
  );
}
