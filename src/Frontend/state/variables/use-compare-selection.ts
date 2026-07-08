// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useVariable } from './use-variable';

export const COMPARE_SELECTION_SOURCE = 'compare-selection-source';

export interface CompareSelectionSource {
  id: string;
  label: string;
}

export function useCompareSelectionSource() {
  return useVariable<CompareSelectionSource | null>(
    COMPARE_SELECTION_SOURCE,
    null,
  );
}
