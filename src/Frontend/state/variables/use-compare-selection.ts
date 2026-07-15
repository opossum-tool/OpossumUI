// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken } from '@tanstack/react-query';

import { backend } from '../../util/backendClient';
import { useVariable } from './use-variable';

export const COMPARE_SELECTION_SOURCE = 'compare-selection-source';

export function useCompareSelectionSource() {
  const [compareSelectionSourceId, setCompareSelectionSource] = useVariable<
    string | null
  >(COMPARE_SELECTION_SOURCE, null);
  const sourceAttribution = backend.getAttributionData.useQuery(
    compareSelectionSourceId
      ? { attributionUuid: compareSelectionSourceId }
      : skipToken,
  );

  return {
    compareSelectionSource: sourceAttribution.data?.packageInfo,
    setCompareSelectionSource,
  };
}
