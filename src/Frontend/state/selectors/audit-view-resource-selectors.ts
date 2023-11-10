// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pick } from 'lodash';

import { Attributions } from '../../../shared/shared-types';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { PanelPackage, State } from '../../types/types';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getAttributionBreakpointCheckForState } from '../../util/is-attribution-breakpoint';
import {
  getManualAttributions,
  getManualDisplayPackageInfoOfSelected,
  getResourcesToManualAttributions,
  getTemporaryDisplayPackageInfo,
} from './all-views-resource-selectors';

export function getSelectedResourceId(state: State): string {
  return state.resourceState.auditView.selectedResourceId;
}

export function getTargetSelectedResourceId(state: State): string | null {
  return state.resourceState.auditView.targetSelectedResourceId;
}

export function getExpandedIds(state: State): Array<string> {
  return state.resourceState.auditView.expandedIds;
}

export function getTargetDisplayedPackage(state: State): PanelPackage | null {
  return state.resourceState.auditView.targetDisplayedPanelPackage;
}

export function getResolvedExternalAttributions(state: State): Set<string> {
  return state.resourceState.auditView.resolvedExternalAttributions;
}

export function getAttributionIdsOfSelectedResourceClosestParent(
  state: State,
): Array<string> {
  const selectedResourceId = getSelectedResourceId(state);
  const resourcesToManualAttributions = getResourcesToManualAttributions(state);

  return getClosestParentAttributionIds(
    selectedResourceId,
    resourcesToManualAttributions,
    getAttributionBreakpointCheckForState(state),
  );
}

function getAttributionsOfSelectedResourceClosestParent(
  state: State,
): Attributions {
  const attributionIdsOfClosestParent: Array<string> =
    getAttributionIdsOfSelectedResourceClosestParent(state);
  const manualAttributions: Attributions = getManualAttributions(state);

  return pick(manualAttributions, attributionIdsOfClosestParent);
}

export function getAttributionIdsOfSelectedResource(
  state: State,
): Array<string> | null {
  const selectedResourceId = getSelectedResourceId(state);
  const resourcesToManualAttributions = getResourcesToManualAttributions(state);

  return resourcesToManualAttributions[selectedResourceId] || null;
}

export function getAttributionsOfSelectedResource(state: State): Attributions {
  return pick(
    getManualAttributions(state),
    getAttributionIdsOfSelectedResource(state) || [],
  );
}

export function getAttributionsOfSelectedResourceOrClosestParent(
  state: State,
): Attributions {
  const attributionsOfSelectedResource: Attributions =
    getAttributionsOfSelectedResource(state);
  return Object.keys(attributionsOfSelectedResource).length > 0
    ? attributionsOfSelectedResource
    : getAttributionsOfSelectedResourceClosestParent(state);
}

export function getIsAccordionSearchFieldDisplayed(state: State): boolean {
  return state.resourceState.auditView.accordionSearchField
    .isSearchFieldDisplayed;
}

export function getPackageSearchTerm(state: State): string {
  return state.resourceState.auditView.accordionSearchField.searchTerm;
}

export function getDidPreferredFieldChange(state: State): boolean {
  const temporaryDisplayPackageInfo = getTemporaryDisplayPackageInfo(state);
  const initialManualDisplayPackageInfo =
    getManualDisplayPackageInfoOfSelected(state) || EMPTY_DISPLAY_PACKAGE_INFO;
  const initialIsPreferred = initialManualDisplayPackageInfo.preferred ?? false;
  const tempIsPreferred =
    temporaryDisplayPackageInfo.preferred ?? initialIsPreferred;
  return initialIsPreferred !== tempIsPreferred;
}
