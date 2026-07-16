// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PackageInfo } from '../../../shared/shared-types';
import { useAttributionIdsForReplacement } from './use-attribution-ids-for-replacement';
import { useCompareSelectionSource } from './use-compare-selection';

export type PickerMode =
  | { mode: 'inactive'; isActive: false }
  | {
      mode: 'replace';
      isActive: true;
      attributionIdsForReplacement: Array<string>;
    }
  | {
      mode: 'compare';
      isActive: true;
      compareSelectionSource: PackageInfo;
    };

export function usePickerMode(): PickerMode {
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const { compareSelectionSource } = useCompareSelectionSource();

  if (attributionIdsForReplacement.length) {
    return {
      mode: 'replace',
      isActive: true,
      attributionIdsForReplacement,
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
