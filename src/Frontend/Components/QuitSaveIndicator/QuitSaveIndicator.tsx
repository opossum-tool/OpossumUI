// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogTitle from '@mui/material/DialogTitle';

import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import { getIsSavingBeforeQuit } from '../../state/selectors/view-selector';
import { Dialog } from '../Dialog/dialog';

export function QuitSaveIndicator(): React.ReactNode {
  const isSavingBeforeQuit = useAppSelector(getIsSavingBeforeQuit);

  return (
    <Dialog
      open={isSavingBeforeQuit}
      aria-label={text.quitSaveIndicator.saving}
    >
      <MuiDialogTitle>{text.quitSaveIndicator.saving}</MuiDialogTitle>
    </Dialog>
  );
}
