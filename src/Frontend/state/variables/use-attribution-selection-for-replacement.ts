// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionSelection } from '../../../shared/attribution-selection';
import { useVariable } from './use-variable';

export const ATTRIBUTION_SELECTION_FOR_REPLACEMENT =
  'attribution-selection-for-replacement';

export function useAttributionSelectionForReplacement() {
  return useVariable<AttributionSelection | null>(
    ATTRIBUTION_SELECTION_FOR_REPLACEMENT,
    null,
  );
}
