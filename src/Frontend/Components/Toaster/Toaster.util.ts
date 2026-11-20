// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable no-restricted-imports */
import type { ReactElement } from 'react';
import toaster, { type ToastOptions } from 'react-hot-toast';

class Toast {
  public success(message: string, options?: ToastOptions) {
    toaster.success(message, { id: message, ...options });
  }

  public error(message: string | (() => ReactElement), options?: ToastOptions) {
    toaster.error(message, {
      id: typeof message === 'string' ? message : undefined,
      ...options,
    });
  }

  public dismiss(id: string) {
    toaster.dismiss(id);
  }

  public remove(id: string) {
    toaster.remove(id);
  }

  public info(message: string, options?: ToastOptions) {
    toaster(message, { id: message, ...options });
  }
}

export const toast = new Toast();
