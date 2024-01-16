// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ProgressBarData } from '../../types/types';
import { useVariable } from './use-variable';

export const OVERALL_PROGRESS_DATA = 'overall-progress-data';

export function useOverallProgressData() {
  return useVariable<ProgressBarData | null>(OVERALL_PROGRESS_DATA, null);
}
