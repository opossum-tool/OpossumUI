// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { FocusedAttributionOutcome } from '../../shared/attribution-selection';
import { applyFocusedAttributionOutcome } from '../state/actions/resource-actions/navigation-actions';
import { useAppDispatch } from '../state/hooks';
import { removeFocusedAttributionQuery } from './invalidate-mutation-queries';

type FocusedAttributionMutationResult = {
  focusedAttributionOutcome: FocusedAttributionOutcome;
};

export function useFocusedAttributionOutcomeBeforeInvalidation() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useCallback(
    ({ focusedAttributionOutcome }: FocusedAttributionMutationResult) => {
      removeFocusedAttributionQuery({
        queryClient,
        outcome: focusedAttributionOutcome,
      });
      dispatch(applyFocusedAttributionOutcome(focusedAttributionOutcome));
    },
    [dispatch, queryClient],
  );
}
