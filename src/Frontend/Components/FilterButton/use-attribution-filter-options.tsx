// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useRef } from 'react';

import type { FilterProperties } from '../../../ElectronBackend/api/queries';
import type {
  AttributionFilters,
  SetAttributionFilters,
} from '../../state/variables/use-filters';
import type { AttributionFilterOption } from '../AttributionPanels/attribution-filter-options';
import type { SelectMenuOption } from '../SelectMenu/SelectMenu';
import { LicenseAutocomplete } from './LicenseAutocomplete/LicenseAutocomplete';

export function useAttributionFilterOptions({
  filterOptions,
  filterProps,
  filters,
  setFilters,
}: {
  filterOptions: Array<AttributionFilterOption>;
  filterProps: FilterProperties | null;
  filters: AttributionFilters;
  setFilters: SetAttributionFilters;
}): Array<SelectMenuOption> {
  const licenseInputRef = useRef<HTMLInputElement>(null);
  return useMemo(
    () => [
      ...filterOptions.map(({ key, label, icon }) => {
        const count = filterProps?.[key];

        return {
          id: key,
          selected: filters.filterKeys.includes(key),
          faded: !count,
          label:
            typeof count === 'number'
              ? `${label} (${new Intl.NumberFormat().format(count)})`
              : label,
          icon,
          onAdd: () =>
            setFilters((prev) => ({
              ...prev,
              filterKeys: [...prev.filterKeys, key],
            })),
          onDelete: () =>
            setFilters((prev) => ({
              ...prev,
              filterKeys: prev.filterKeys.filter(
                (activeFilter) => activeFilter !== key,
              ),
            })),
        };
      }),
      {
        id: 'license',
        selected: false,
        focusContent: () => licenseInputRef.current?.focus(),
        label: (
          <LicenseAutocomplete
            inputRef={licenseInputRef}
            licenses={filterProps?.licenses ?? []}
            selectedLicense={filters.selectedLicense}
            setSelectedLicense={(license) =>
              setFilters((prev) => ({
                ...prev,
                selectedLicense: license || '',
              }))
            }
          />
        ),
      },
    ],
    [filterOptions, filterProps, filters, setFilters],
  );
}
