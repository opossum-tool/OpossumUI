// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionSelection } from '../../../shared/attribution-selection';
import type { PackageInfo } from '../../../shared/shared-types';
import { useAttributionSelectionForReplacement } from './use-attribution-selection-for-replacement';
import { useCompareSelectionSource } from './use-compare-selection';

export type PickerMode =
  | { mode: 'inactive'; isActive: false }
  | {
      mode: 'replace';
      isActive: true;
      selectionForReplacement: AttributionSelection;
    }
  | {
      mode: 'compare';
      isActive: true;
      compareSelectionSource: PackageInfo;
    };

export function usePickerMode(): PickerMode {
  const [selectionForReplacement] = useAttributionSelectionForReplacement();
  const { compareSelectionSource } = useCompareSelectionSource();

  if (selectionForReplacement) {
    return {
      mode: 'replace',
      isActive: true,
      selectionForReplacement,
    };
  }

  if (compareSelectionSource) {
    return {
      mode: 'compare',
      isActive: true,
      compareSelectionSource,
    };
  }

  return { mode: 'inactive', isActive: false };
}
