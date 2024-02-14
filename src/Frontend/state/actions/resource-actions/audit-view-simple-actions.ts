// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_SET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_SELECTED_ATTRIBUTION_ID,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  AddResolvedExternalAttributions,
  RemoveResolvedExternalAttributions,
  SetExpandedIdsAction,
  SetResolvedExternalAttributions,
  SetSelectedAttributionId,
  SetSelectedResourceIdAction,
  SetTargetSelectedAttributionIdAction,
  SetTargetSelectedResourceId,
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

export function setResolvedExternalAttributions(
  resolvedExternalAttributions: Set<string>,
): SetResolvedExternalAttributions {
  return {
    type: ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
    payload: resolvedExternalAttributions,
  };
}

export function addResolvedExternalAttributions(
  attributionIds: Array<string>,
): AddResolvedExternalAttributions {
  return {
    type: ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTIONS,
    payload: attributionIds,
  };
}

export function removeResolvedExternalAttributions(
  attributionIds: Array<string>,
): RemoveResolvedExternalAttributions {
  return {
    type: ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTIONS,
    payload: attributionIds,
  };
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
