// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ProgressBarData } from '../../types/types';
import { useVariable } from './use-variable';

export const FOLDER_PROGRESS_DATA = 'folder-progress-data';

export function useFolderProgressData() {
  return useVariable<ProgressBarData | null>(FOLDER_PROGRESS_DATA, null);
}
