// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { FocusedAttributionOutcome } from '../../../../shared/attribution-selection';
import { getParents } from '../../helpers/get-parents';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
} from '../../selectors/resource-selectors';
import type { AppThunkAction } from '../../types';
import {
  type AttributionFilters,
  initialAttributionFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
} from '../../variables/use-filters';
import { setVariable } from '../variables-actions/variables-actions';
import {
  setAttributionSelectionPending,
  setExpandedIds,
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from './audit-view-simple-actions';

export function setSelectedResourceOrAttributionIdToTargetValue(): AppThunkAction {
  return (dispatch, getState) => {
    const targetSelectedResourceId = getTargetSelectedResourceId(getState());
    const targetSelectedAttributionId =
      getTargetSelectedAttributionId(getState());

    if (targetSelectedResourceId !== null) {
      if (getSelectedResourceId(getState()) !== targetSelectedResourceId) {
        dispatch(setAttributionSelectionPending(targetSelectedResourceId));
      }
      dispatch(setSelectedResourceId(targetSelectedResourceId));
      dispatch(setTargetSelectedResourceId(null));
    }

    if (targetSelectedAttributionId !== null) {
      dispatch(setSelectedAttributionId(targetSelectedAttributionId));
      dispatch(setTargetSelectedAttributionId(null));
    }
  };
}

export function resetManualAuditFiltersPreservingSort(): AppThunkAction {
  return (dispatch, getState) => {
    const currentFilters = getState().variablesState[
      MANUAL_ATTRIBUTION_FILTERS_AUDIT
    ] as AttributionFilters | undefined;
    dispatch(
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        sorting: currentFilters?.sorting ?? initialAttributionFilters.sorting,
      }),
    );
  };
}

export function openResourceInResourceBrowser(
  resourceId: string,
): AppThunkAction {
  return (dispatch, getState) => {
    if (getSelectedResourceId(getState()) !== resourceId) {
      dispatch(setAttributionSelectionPending(resourceId));
    }
    dispatch(setExpandedIds(getParents(resourceId).concat([resourceId])));
    dispatch(setSelectedResourceId(resourceId));
  };
}

export function applyFocusedAttributionOutcome(
  outcome: FocusedAttributionOutcome,
): AppThunkAction {
  return (dispatch, getState) => {
    if (
      outcome.status === 'unchanged' ||
      getSelectedAttributionId(getState()) !== outcome.attributionUuid
    ) {
      return;
    }

    dispatch(
      setSelectedAttributionId(
        outcome.status === 'removed' ? '' : outcome.newAttributionUuid,
      ),
    );
  };
}
