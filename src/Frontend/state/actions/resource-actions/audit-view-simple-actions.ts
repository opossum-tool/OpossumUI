// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PanelPackage } from '../../../types/types';
import {
  ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION,
  ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION,
  ACTION_SET_DISPLAYED_PANEL_PACKAGE,
  ACTION_SET_EXPANDED_IDS,
  ACTION_SET_PACKAGE_SEARCH_TERM,
  ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
  ACTION_SET_SELECTED_RESOURCE_ID,
  ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE,
  ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
  ACTION_TOGGLE_ACCORDION_SEARCH_FIELD,
  AddResolvedExternalAttribution,
  RemoveResolvedExternalAttribution,
  SetDisplayedPanelPackageAction,
  SetExpandedIdsAction,
  SetPackageSearchTerm,
  SetResolvedExternalAttributions,
  SetSelectedResourceIdAction,
  SetTargetDisplayedPanelPackageAction,
  SetTargetSelectedResourceId,
  ToggleAccordionSearchField,
} from './types';

export function setSelectedResourceId(
  resourceId: string
): SetSelectedResourceIdAction {
  return { type: ACTION_SET_SELECTED_RESOURCE_ID, payload: resourceId };
}

export function setTargetSelectedResourceId(
  targetSelectedResourceId: string | null
): SetTargetSelectedResourceId {
  return {
    type: ACTION_SET_TARGET_SELECTED_RESOURCE_ID,
    payload: targetSelectedResourceId,
  };
}

export function setExpandedIds(
  expandedIds: Array<string>
): SetExpandedIdsAction {
  return { type: ACTION_SET_EXPANDED_IDS, payload: expandedIds };
}

export function setDisplayedPackage(
  displayedPanel: PanelPackage | null
): SetDisplayedPanelPackageAction {
  return {
    type: ACTION_SET_DISPLAYED_PANEL_PACKAGE,
    payload: displayedPanel,
  };
}

export function setTargetDisplayedPackage(
  targetDisplayedPanel: PanelPackage | null
): SetTargetDisplayedPanelPackageAction {
  return {
    type: ACTION_SET_TARGET_DISPLAYED_PANEL_PACKAGE,
    payload: targetDisplayedPanel,
  };
}

export function setResolvedExternalAttributions(
  resolvedExternalAttributions: Set<string>
): SetResolvedExternalAttributions {
  return {
    type: ACTION_SET_RESOLVED_EXTERNAL_ATTRIBUTIONS,
    payload: resolvedExternalAttributions,
  };
}

export function addResolvedExternalAttribution(
  resolvedExternalAttribution: string
): AddResolvedExternalAttribution {
  return {
    type: ACTION_ADD_RESOLVED_EXTERNAL_ATTRIBUTION,
    payload: resolvedExternalAttribution,
  };
}

export function removeResolvedExternalAttribution(
  resolvedExternalAttribution: string
): RemoveResolvedExternalAttribution {
  return {
    type: ACTION_REMOVE_RESOLVED_EXTERNAL_ATTRIBUTION,
    payload: resolvedExternalAttribution,
  };
}

export function toggleAccordionSearchField(): ToggleAccordionSearchField {
  return { type: ACTION_TOGGLE_ACCORDION_SEARCH_FIELD };
}

export function setPackageSearchTerm(searchTerm: string): SetPackageSearchTerm {
  return {
    type: ACTION_SET_PACKAGE_SEARCH_TERM,
    payload: searchTerm,
  };
}
