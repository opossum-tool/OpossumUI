// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback } from 'react';

import type { FocusedAttributionOutcome } from '../../shared/attribution-selection';
import { useAppStore } from '../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../state/selectors/resource-selectors';
import { useVariable } from '../state/variables/use-variable';

const ATTRIBUTION_SAVE_REVEAL = 'attribution-save-reveal';

interface AttributionSaveReveal {
  attributionUuid: string;
  resourcePath: string;
  revision: number;
}

export function useAttributionSaveReveal() {
  const [saveReveal, setSaveReveal] = useVariable<AttributionSaveReveal | null>(
    ATTRIBUTION_SAVE_REVEAL,
    null,
  );
  const store = useAppStore();

  const publishSaveCompletion = useCallback(
    (
      outcome: FocusedAttributionOutcome,
      originalAttributionUuid: string | undefined,
      resourcePath: string,
    ) => {
      if (
        outcome.status === 'removed' ||
        originalAttributionUuid === undefined
      ) {
        return;
      }

      const attributionUuid =
        outcome.status === 'remapped'
          ? outcome.newAttributionUuid
          : originalAttributionUuid;
      const state = store.getState();
      if (
        getSelectedAttributionId(state) !== attributionUuid ||
        getSelectedResourceId(state) !== resourcePath
      ) {
        return;
      }

      setSaveReveal((previous) => ({
        attributionUuid,
        resourcePath,
        revision: (previous?.revision ?? 0) + 1,
      }));
    },
    [setSaveReveal, store],
  );

  const getSelectionRevealKey = useCallback(
    (attributionUuid: string, resourcePath: string) =>
      saveReveal?.attributionUuid === attributionUuid &&
      saveReveal.resourcePath === resourcePath
        ? String(saveReveal.revision)
        : undefined,
    [saveReveal],
  );

  return { publishSaveCompletion, getSelectionRevealKey };
}
