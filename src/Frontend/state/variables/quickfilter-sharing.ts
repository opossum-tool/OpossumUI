// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import {
  isAttributionQuickfilter,
  isResourceQuickfilter,
  type QuickfilterScope,
  type SavedAttributionQuickfilter,
  type SavedQuickfilter,
  type SavedResourceQuickfilter,
} from '../../../shared/shared-types';
import { useUserSettings } from './use-user-setting';

export type AttributionQuickfilterScope = Exclude<QuickfilterScope, 'resource'>;

/**
 * Converts an attribution/signal quickfilter into a resource quickfilter
 * model when it is fully expressible there: only the license dimensions are
 * shared between the panels, so every other condition (filter keys, search
 * text, classification, criticality, incomplete coordinates/legal) makes it
 * resource-inapplicable. `null` models are never persisted; they only exist
 * for display and application on the target panel.
 */
export function toResourceQuickfilterModel(
  quickfilter: SavedAttributionQuickfilter,
): SavedResourceQuickfilter | null {
  const { filters, search, valueFilters } = quickfilter.filters;
  if (
    filters.length ||
    search ||
    valueFilters.classification !== undefined ||
    valueFilters.criticality !== undefined ||
    valueFilters.incompleteCoordinates !== undefined ||
    valueFilters.incompleteLegal !== undefined
  ) {
    return null;
  }
  return {
    id: quickfilter.id,
    name: quickfilter.name,
    lastUsedAt: quickfilter.lastUsedAt,
    scope: 'resource',
    filters: {
      onlyUnreviewedFiles: false,
      onlyWithAiDeferredAttributions: false,
      selectedLicenses: valueFilters.license ? [...valueFilters.license] : [],
      licenseSearches: valueFilters.licenseSearches?.length
        ? [...valueFilters.licenseSearches]
        : undefined,
    },
  };
}

/**
 * Inverse conversion: resource quickfilter into an attribution/signal
 * quickfilter model when it is fully expressible there (i.e. it does not
 * rely on the resource-only booleans). License-only conditions are carried
 * over; `scope` decides which attribution-panel flavor the model renders
 * for and is never persisted.
 */
export function toAttributionQuickfilterModel(
  quickfilter: SavedResourceQuickfilter,
  scope: AttributionQuickfilterScope,
): SavedAttributionQuickfilter | null {
  const {
    onlyUnreviewedFiles,
    onlyWithAiDeferredAttributions,
    selectedLicenses,
    licenseSearches,
  } = quickfilter.filters;
  if (onlyUnreviewedFiles || onlyWithAiDeferredAttributions) {
    return null;
  }
  return {
    id: quickfilter.id,
    name: quickfilter.name,
    lastUsedAt: quickfilter.lastUsedAt,
    scope,
    filters: {
      filters: [],
      search: '',
      valueFilters: {
        license: selectedLicenses.length ? [...selectedLicenses] : undefined,
        licenseSearches: licenseSearches?.length
          ? [...licenseSearches]
          : undefined,
      },
    },
  };
}

/**
 * Whether the resource quickfilter is also usable on the given
 * attribution-flavored panel.
 */
export function isShareableWithAttributionPanel(
  quickfilter: SavedResourceQuickfilter,
  scope: AttributionQuickfilterScope,
): boolean {
  return toAttributionQuickfilterModel(quickfilter, scope) !== null;
}

export function isVisibleForAttributionPanel(
  scope: AttributionQuickfilterScope,
): (quickfilter: SavedQuickfilter) => boolean {
  return (quickfilter) =>
    isAttributionQuickfilter(quickfilter)
      ? quickfilter.scope === scope
      : isShareableWithAttributionPanel(quickfilter, scope);
}

export function isVisibleForResourcePanel(
  quickfilter: SavedQuickfilter,
): boolean {
  return (
    isResourceQuickfilter(quickfilter) ||
    (isAttributionQuickfilter(quickfilter) &&
      toResourceQuickfilterModel(quickfilter) !== null)
  );
}

/**
 * Quickfilters visibly offered on the given attribution-flavored panel:
 * its own-scope quickfilters plus license-only resource quickfilters
 * converted to models, in creation (global persistence) order.
 */
export function useVisibleQuickfilters(
  scope: AttributionQuickfilterScope,
): Array<SavedAttributionQuickfilter> {
  const [userSettings] = useUserSettings();
  return useMemo(
    () =>
      userSettings.savedQuickfilters.flatMap((quickfilter) => {
        if (isAttributionQuickfilter(quickfilter)) {
          return quickfilter.scope === scope ? [quickfilter] : [];
        }
        const model = toAttributionQuickfilterModel(quickfilter, scope);
        return model ? [model] : [];
      }),
    [userSettings.savedQuickfilters, scope],
  );
}

/**
 * Quickfilters visibly offered on the resources panel: resource
 * quickfilters plus license-only attribution/signal quickfilters converted
 * to models, in creation (global persistence) order.
 */
export function useVisibleQuickfiltersForResources(): Array<SavedResourceQuickfilter> {
  const [userSettings] = useUserSettings();
  return useMemo(
    () =>
      userSettings.savedQuickfilters.flatMap((quickfilter) => {
        if (isResourceQuickfilter(quickfilter)) {
          return [quickfilter];
        }
        const model = toResourceQuickfilterModel(quickfilter);
        return model ? [model] : [];
      }),
    [userSettings.savedQuickfilters],
  );
}
