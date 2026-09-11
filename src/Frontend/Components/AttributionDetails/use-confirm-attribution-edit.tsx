// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogContentText from '@mui/material/DialogContentText';
import { type ReactNode, useCallback, useState } from 'react';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { useCompareToOriginal } from '../../util/use-compare-to-original';
import {
  type Confirm,
  ConfirmationDialog,
  type ConfirmOptions,
  useConfirmationDialog,
} from '../ConfirmationDialog/ConfirmationDialog';
import { WasPreferredIcon } from '../Icons/Icons';

export function useConfirmAttributionEdit(
  packageInfo: PackageInfo,
  label?: string,
): { confirm: Confirm; dialog: ReactNode; isOpen: boolean } {
  const comparison = useCompareToOriginal(packageInfo);
  const shouldWarn =
    comparison.hasOriginal &&
    comparison.isEqualToOriginal === true &&
    packageInfo.originalAttributionWasPreferred;
  const [confirmationRef, confirmWithDialog] = useConfirmationDialog({
    skip: !shouldWarn,
  });
  const [isOpen, setIsOpen] = useState(false);
  const confirm = useCallback<Confirm>(
    async (onConfirm, options?: ConfirmOptions) => {
      const opensDialog = shouldWarn && !options?.skip;
      if (opensDialog) {
        setIsOpen(true);
      }
      try {
        return await confirmWithDialog(onConfirm, options);
      } finally {
        if (opensDialog) {
          setIsOpen(false);
        }
      }
    },
    [confirmWithDialog, shouldWarn],
  );

  return {
    confirm,
    isOpen,
    dialog: (
      <ConfirmationDialog
        ref={confirmationRef}
        message={
          <MuiDialogContentText
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {label ? `${label}: ` : ''}
            {text.modifyWasPreferredPopup.message}
            <WasPreferredIcon />
            {'.'}
          </MuiDialogContentText>
        }
        title={text.modifyWasPreferredPopup.title}
      />
    ),
  };
}
