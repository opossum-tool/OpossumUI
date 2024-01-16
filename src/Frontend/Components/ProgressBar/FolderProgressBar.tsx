// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiSkeleton from '@mui/material/Skeleton';
import { ReactElement } from 'react';

import { useFolderProgressData } from '../../state/variables/use-folder-progress-data';
import { ProgressBar } from './ProgressBar';

const classes = {
  root: {
    flex: 0,
  },
};

export function FolderProgressBar(): ReactElement {
  const [progressData] = useFolderProgressData();

  return progressData ? (
    <ProgressBar
      sx={classes.root}
      progressBarType={'FolderProgressBar'}
      progressBarData={progressData}
    />
  ) : (
    <MuiSkeleton height={20} />
  );
}
