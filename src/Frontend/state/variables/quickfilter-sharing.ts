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
 * model when it is fully expressible there (only the license dimensions are
 * shared between the panels). Models are never persisted; they only exist
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
 * Inverse conversion: resource quickfilter into an attribution/signal model
 * when it does not rely on the resource-only booleans.
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

/** Whether the attribution/signal quickfilter is license-only. */
function isLicenseOnlyAttributionQuickfilter(
  quickfilter: SavedAttributionQuickfilter,
): boolean {
  return toResourceQuickfilterModel(quickfilter) !== null;
}

function isShareableWithAttributionPanel(
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
      ? quickfilter.scope === scope ||
        isLicenseOnlyAttributionQuickfilter(quickfilter)
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
 * The quickfilters offered on the given panel: its own-scope quickfilters
 * plus license-only quickfilters from other scopes, converted to the panel's
 * model where needed, in the saved order.
 */
export function useVisibleQuickfilters(
  scope: AttributionQuickfilterScope,
): Array<SavedAttributionQuickfilter> {
  const [userSettings] = useUserSettings();
  return useMemo(
    () =>
      userSettings.savedQuickfilters.flatMap((quickfilter) => {
        if (isAttributionQuickfilter(quickfilter)) {
          return quickfilter.scope === scope ||
            isLicenseOnlyAttributionQuickfilter(quickfilter)
            ? [quickfilter]
            : [];
        }
        const model = toAttributionQuickfilterModel(quickfilter, scope);
        return model ? [model] : [];
      }),
    [userSettings.savedQuickfilters, scope],
  );
}

/** The quickfilters offered on the resources panel, in the saved order. */
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
