// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useVariable } from './use-variable';

export const ATTRIBUTION_IDS_FOR_REPLACEMENT =
  'attribution-ids-for-replacement';

export function useAttributionIdsForReplacement() {
  return useVariable<Array<string>>(ATTRIBUTION_IDS_FOR_REPLACEMENT, []);
}
