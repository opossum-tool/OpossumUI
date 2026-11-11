// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useRef } from 'react';

import {
  useManualAttributionFilters,
  useResourceTreeFilters,
} from '../state/variables/use-filters';
import {
  filterCompatibleLicenses,
  type LicenseFilterSelection,
  mergeLicenseSelections,
  sameLicenseSelection,
} from './license-filter-sync';
import { useProjectLicenseOptions } from './use-filter-properties';

/**
 * Keeps the license filters of the attributions panel and the resources
 * panel in sync: a selection in either panel is mirrored into the other,
 * restricted to the licenses the target panel offers, and applied to the
 * resource tree and the attribution lists alike.
 */
export function useSharedLicenseFilters(): void {
  const [resourceTreeFilters, setResourceTreeFilters] =
    useResourceTreeFilters();
  const [auditFilters, setAuditFilters] = useManualAttributionFilters();
  const { licenses: resourceLicenses, licensesLoaded: resourceLicensesLoaded } =
    useProjectLicenseOptions({ external: true });
  const {
    licenses: attributionLicenses,
    licensesLoaded: attributionLicensesLoaded,
  } = useProjectLicenseOptions({ external: false });

  const resourceLicenseIds = useMemo(
    () => new Set(resourceLicenses.map(({ id }) => id)),
    [resourceLicenses],
  );
  const attributionLicenseIds = useMemo(
    () => new Set(attributionLicenses.map(({ id }) => id)),
    [attributionLicenses],
  );

  const previousSelectionRef = useRef<{
    attribution: LicenseFilterSelection;
    resource: LicenseFilterSelection;
  } | null>(null);

  useEffect(() => {
    const attribution: LicenseFilterSelection = {
      licenses: auditFilters.valueFilters.license ?? [],
      licenseSearches: auditFilters.valueFilters.licenseSearches ?? [],
    };
    const resource: LicenseFilterSelection = {
      licenses: resourceTreeFilters.selectedLicenses,
      licenseSearches: resourceTreeFilters.licenseSearches ?? [],
    };

    // Compatibility needs the licenses both panels offer; defer the initial
    // sync until both lists are loaded.
    if (!resourceLicensesLoaded || !attributionLicensesLoaded) {
      previousSelectionRef.current = null;
      return;
    }

    let pendingAttribution = attribution;
    let pendingResource = resource;
    const writeResource = (selection: LicenseFilterSelection): void => {
      if (sameLicenseSelection(selection, pendingResource)) {
        return;
      }
      pendingResource = selection;
      setResourceTreeFilters((prevFilters) => ({
        ...prevFilters,
        selectedLicenses: selection.licenses,
        licenseSearches: selection.licenseSearches,
      }));
    };
    const writeAttribution = (selection: LicenseFilterSelection): void => {
      if (sameLicenseSelection(selection, pendingAttribution)) {
        return;
      }
      pendingAttribution = selection;
      setAuditFilters((prevFilters) => ({
        ...prevFilters,
        valueFilters: {
          ...prevFilters.valueFilters,
          license: selection.licenses.length ? selection.licenses : undefined,
          licenseSearches: selection.licenseSearches.length
            ? selection.licenseSearches
            : undefined,
        },
      }));
    };

    const previous = previousSelectionRef.current;
    if (!previous) {
      // Initial adoption: a selection on one side is shared with the other;
      // when both sides have selections, their union is shared.
      const merged = mergeLicenseSelections(attribution, resource);
      writeResource({
        licenses: filterCompatibleLicenses(merged.licenses, resourceLicenseIds),
        licenseSearches: merged.licenseSearches,
      });
      writeAttribution({
        licenses: filterCompatibleLicenses(
          merged.licenses,
          attributionLicenseIds,
        ),
        licenseSearches: merged.licenseSearches,
      });
    } else {
      const attributionChanged = !sameLicenseSelection(
        previous.attribution,
        attribution,
      );
      const resourceChanged = !sameLicenseSelection(
        previous.resource,
        resource,
      );
      if (attributionChanged && !resourceChanged) {
        writeResource({
          licenses: filterCompatibleLicenses(
            attribution.licenses,
            resourceLicenseIds,
          ),
          licenseSearches: attribution.licenseSearches,
        });
      } else if (resourceChanged && !attributionChanged) {
        writeAttribution({
          licenses: filterCompatibleLicenses(
            resource.licenses,
            attributionLicenseIds,
          ),
          licenseSearches: resource.licenseSearches,
        });
      }
      // When both sides changed at once there is no single source to
      // propagate; the next single-sided edit resumes the sync.
    }
    previousSelectionRef.current = {
      attribution: pendingAttribution,
      resource: pendingResource,
    };
  }, [
    auditFilters,
    resourceTreeFilters,
    resourceLicenseIds,
    attributionLicenseIds,
    resourceLicensesLoaded,
    attributionLicensesLoaded,
    setResourceTreeFilters,
    setAuditFilters,
  ]);
}
