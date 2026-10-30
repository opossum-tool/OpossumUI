// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLinearProgress from '@mui/material/LinearProgress';

import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import { getIsSavingBeforeQuit } from '../../state/selectors/view-selector';

export function QuitSaveIndicator(): React.ReactNode {
  const isSavingBeforeQuit = useAppSelector(getIsSavingBeforeQuit);

  if (!isSavingBeforeQuit) {
    return null;
  }

  return (
    <MuiLinearProgress
      aria-label={text.quitSaveIndicator.saving}
      sx={{ flexShrink: 0 }}
    />
  );
}
