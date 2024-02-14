// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ProgressBarData } from '../../types/types';
import { useVariable } from './use-variable';

export const PROGRESS_DATA = 'progress-data';

export function useProgressData() {
  return useVariable<ProgressBarData | null>(PROGRESS_DATA, null);
}
