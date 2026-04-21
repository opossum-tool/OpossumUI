// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  type SetExpandedIdsAction,
  type SetSelectedAttributionId,
  type SetSelectedResourceIdAction,
  type SetTargetSelectedAttributionIdAction,
  type SetTargetSelectedResourceId,
} from './types';

export function setSelectedResourceId(
  resourceId: string,
): SetSelectedResourceIdAction {
  return { type: ACTION_SET_SELECTED_RESOURCE_ID, payload: resourceId };
}

export function setTargetSelectedResourceId(
  targetSelectedResourceId: string | null,
): SetTargetSelectedResourceId {
  return {
    type: ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
    payload: targetSelectedResourceId,
  };
}

export function setExpandedIds(
  expandedIds: Array<string>,
): SetExpandedIdsAction {
  return { type: ACTION_SET_EXPANDED_IDS, payload: expandedIds };
}

export function setSelectedAttributionId(
  selectedAttributionId: string,
): SetSelectedAttributionId {
  return {
    type: ACTION_SET_SELECTED_ATTRIBUTION_ID,
    payload: selectedAttributionId,
  };
}

export function setTargetSelectedAttributionId(
  targetSelectedAttributionId: string | null,
): SetTargetSelectedAttributionIdAction {
  return {
    type: ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
    payload: targetSelectedAttributionId,
  };
}
