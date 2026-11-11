// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog, { type DialogProps } from '@mui/material/Dialog';
import { type Ref, useEffect, useId } from 'react';

import { useDialogRegistration } from './dialog-provider';

interface RegisteredDialogProps extends DialogProps {
  ref?: Ref<HTMLDivElement>;
}

export function Dialog(props: RegisteredDialogProps) {
  const { open, ref, ...dialogProps } = props;
  const id = useId();
  const { register, unregister } = useDialogRegistration();

  useEffect(() => {
    if (!open) {
      return;
    }
    register(id);
    return () => unregister(id);
  }, [id, open, register, unregister]);

  return <MuiDialog {...dialogProps} ref={ref} open={open} />;
}
