// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable no-restricted-imports */
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { styled, Typography } from '@mui/material';
import { Toaster as RHTToaster, ToastBar, ToastType } from 'react-hot-toast';

const icons: Record<ToastType, React.ReactNode> = {
  error: <ErrorIcon color={'error'} />,
  success: <CheckCircleIcon color={'success'} />,
  loading: null,
  blank: <InfoIcon color={'info'} />,
  custom: null,
};

const ToastContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '340px',
});

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
              {icons[toast.type]}
              {typeof toast.message === 'function' ? (
                toast.message(toast)
              ) : (
                <Typography>{toast.message}</Typography>
              )}
            </ToastContainer>
          )}
        </ToastBar>
      )}
    </RHTToaster>
  );
}
