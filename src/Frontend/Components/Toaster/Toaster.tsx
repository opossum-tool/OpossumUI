// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable no-restricted-imports */
import { styled, Typography } from '@mui/material';
import { Toaster as RHTToaster, ToastBar } from 'react-hot-toast';

const ToastContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%',
  minWidth: 0,
}));

const ToastIconContainer = styled('div')({
  alignSelf: 'flex-start',
  flex: '0 0 auto',
});

const ToastMessageContainer = styled('div')({
  flex: '1 1 auto',
  minWidth: 0,
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
        <ToastBar toast={toast} style={toast.style}>
          {({ icon, message }) => (
            <ToastContainer>
              {icon && <ToastIconContainer>{icon}</ToastIconContainer>}
              <ToastMessageContainer>
                {typeof message === 'string' ? (
                  <Typography>{message}</Typography>
                ) : (
                  message
                )}
              </ToastMessageContainer>
            </ToastContainer>
          )}
        </ToastBar>
      )}
    </RHTToaster>
  );
}
