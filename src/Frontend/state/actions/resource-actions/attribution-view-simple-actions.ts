// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT,
  ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS,
  ACTION_SET_MULTI_SELECT_MODE,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  SetAttributionIdMarkedForReplacement,
  SetMultiSelectSelectedAttributionIds,
  SetMultiSelectMode,
  SetSelectedAttributionId,
  SetTargetSelectedAttributionIdAction,
} from './types';

export function setSelectedAttributionId(
  selectedAttributionId: string
): SetSelectedAttributionId {
  return {
    type: ACTION_SET_SELECTED_ATTRIBUTION_ID,
    payload: selectedAttributionId,
  };
}

export function setTargetSelectedAttributionId(
  targetSelectedAttributionId: string
): SetTargetSelectedAttributionIdAction {
  return {
    type: ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
    payload: targetSelectedAttributionId,
  };
}

export function setAttributionIdMarkedForReplacement(
  attributionIdMarkedForReplacement: string
): SetAttributionIdMarkedForReplacement {
  return {
    type: ACTION_SET_ATTRIBUTION_ID_MARKED_FOR_REPLACEMENT,
    payload: attributionIdMarkedForReplacement,
  };
}

export function setMultiSelectMode(
  multiSelectMode: boolean
): SetMultiSelectMode {
  return {
    type: ACTION_SET_MULTI_SELECT_MODE,
    payload: multiSelectMode,
  };
}

export function setMultiSelectSelectedAttributionIds(
  multiSelectSelectedAttributionIds: Array<string>
): SetMultiSelectSelectedAttributionIds {
  return {
    type: ACTION_SET_MULTI_SELECT_SELECTED_ATTRIBUTION_IDS,
    payload: multiSelectSelectedAttributionIds,
  };
}
