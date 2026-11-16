// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog, { type DialogProps } from '@mui/material/Dialog';
import { type Ref, useEffect, useId } from 'react';

import {
  type DialogClassification,
  useDialogRegistration,
} from './dialog-provider';

interface RegisteredDialogProps extends DialogProps {
  ref?: Ref<HTMLDivElement>;
  classification?: DialogClassification;
}

export function Dialog(props: RegisteredDialogProps) {
  const { open, ref, classification = 'workflow', ...dialogProps } = props;
  const id = useId();
  const { register, unregister } = useDialogRegistration();

  useEffect(() => {
    if (!open) {
      return;
    }
    register(id, classification);
    return () => unregister(id);
  }, [classification, id, open, register, unregister]);

  return <MuiDialog {...dialogProps} ref={ref} open={open} />;
}
