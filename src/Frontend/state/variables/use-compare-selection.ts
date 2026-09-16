// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { skipToken, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { backend } from '../../util/backendClient';
import { removeAttributionDataQuery } from '../../util/invalidate-mutation-queries';
import { useVariable } from './use-variable';

export const COMPARE_SELECTION_SOURCE = 'compare-selection-source';

export function useCompareSelectionSource() {
  const [compareSelectionSourceId, setCompareSelectionSource] = useVariable<
    string | null
  >(COMPARE_SELECTION_SOURCE, null);
  const queryClient = useQueryClient();
  const sourceAttribution = backend.getAttributionData.useQuery(
    compareSelectionSourceId
      ? { attributionUuid: compareSelectionSourceId }
      : skipToken,
  );
  const clearCompareSelectionAfterSave = useCallback(() => {
    if (compareSelectionSourceId !== null) {
      removeAttributionDataQuery({
        queryClient,
        attributionUuid: compareSelectionSourceId,
      });
    }
    setCompareSelectionSource(null);
  }, [compareSelectionSourceId, queryClient, setCompareSelectionSource]);

  return {
    compareSelectionSource: sourceAttribution.data?.packageInfo,
    compareSelectionSourceIsExternal: sourceAttribution.data?.isExternal,
    clearCompareSelectionAfterSave,
    setCompareSelectionSource,
  };
}
