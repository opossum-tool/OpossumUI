// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useRef } from 'react';

import type { FilterProperties } from '../../../ElectronBackend/api/queries';
import {
  INCOMPLETE_COORDINATE_FILTER_VALUES,
  INCOMPLETE_LEGAL_FILTER_VALUES,
} from '../../../shared/attribution-filters';
import { text } from '../../../shared/text';
import type { AttributionFilters } from '../../state/variables/use-filters';
import type { AttributionFilterOption } from '../AttributionPanels/attribution-filter-options';
import { IncompleteIcon } from '../Icons/Icons';
import type { SelectMenuOption } from '../SelectMenu/SelectMenu';
import { LicenseAutocomplete } from './LicenseAutocomplete/LicenseAutocomplete';
import { ValueFilterAutocomplete } from './ValueFilterAutocomplete/ValueFilterAutocomplete';

const incompleteCoordinateLabels = {
  any: text.filters.any,
  url: text.filters.missingUrl,
  packageName: text.filters.missingPackageName,
  packageType: text.filters.missingPackageType,
  packageNamespace: text.filters.missingPackageNamespace,
};

const incompleteLegalLabels = {
  any: text.filters.any,
  copyright: text.filters.missingCopyright,
  licenseInformation: text.filters.missingLicenseInformation,
};

const selectedIncompleteCoordinateLabels = {
  any: text.filters.incompleteCoordinates,
  url: text.filters.selectedMissingUrl,
  packageName: text.filters.selectedMissingPackageName,
  packageType: text.filters.selectedMissingPackageType,
  packageNamespace: text.filters.selectedMissingPackageNamespace,
};

const selectedIncompleteLegalLabels = {
  any: text.filters.incompleteLegal,
  copyright: text.filters.selectedMissingCopyright,
  licenseInformation: text.filters.selectedMissingLicenseInformation,
};

type SetFilters = (filters: AttributionFilters) => void;

export function useAttributionFilterOptions({
  filterOptions,
  filterProps,
  filters,
  setFilters,
}: {
  filterOptions: Array<AttributionFilterOption>;
  filterProps: FilterProperties | null;
  filters: AttributionFilters;
  setFilters: SetFilters;
}): Array<SelectMenuOption> {
  const licenseInputRef = useRef<HTMLInputElement>(null);
  return useMemo(
    () => [
      ...filterOptions.map(({ key, label, icon }) => {
        const count = filterProps?.[key];

        return {
          id: key,
          selected: filters.filters.includes(key),
          faded: !count,
          label:
            typeof count === 'number'
              ? `${label} (${new Intl.NumberFormat().format(count)})`
              : label,
          icon,
          onAdd: () =>
            setFilters({
              ...filters,
              filters: [...filters.filters, key],
            }),
          onDelete: () =>
            setFilters({
              ...filters,
              filters: filters.filters.filter(
                (activeFilter) => activeFilter !== key,
              ),
            }),
        };
      }),
      getLicenseFilterOption({
        filterProps,
        filters,
        licenseInputRef,
        setFilters,
      }),
      getIncompleteCoordinatesFilterOption({ filters, setFilters }),
      getIncompleteLegalFilterOption({ filters, setFilters }),
    ],
    [filterOptions, filterProps, filters, setFilters],
  );
}

function getLicenseFilterOption({
  filterProps,
  filters,
  licenseInputRef,
  setFilters,
}: {
  filterProps: FilterProperties | null;
  filters: AttributionFilters;
  licenseInputRef: React.RefObject<HTMLInputElement | null>;
  setFilters: SetFilters;
}): SelectMenuOption {
  return {
    id: 'license',
    selected: false,
    focusContent: () => licenseInputRef.current?.focus(),
    label: (
      <LicenseAutocomplete
        inputRef={licenseInputRef}
        licenses={filterProps?.licenses ?? []}
        selectedLicense={filters.valueFilters.license ?? ''}
        setSelectedLicense={(value) =>
          setFilters({
            ...filters,
            valueFilters: {
              ...filters.valueFilters,
              license: value ?? undefined,
            },
          })
        }
      />
    ),
  };
}

function getIncompleteCoordinatesFilterOption({
  filters,
  setFilters,
}: {
  filters: AttributionFilters;
  setFilters: SetFilters;
}): SelectMenuOption {
  return {
    id: 'incompleteCoordinates',
    selected: false,
    label: (
      <ValueFilterAutocomplete
        ariaLabel={'incomplete component coordinates'}
        getSelectedValueLabel={(value) =>
          selectedIncompleteCoordinateLabels[
            INCOMPLETE_COORDINATE_FILTER_VALUES.find(
              (attribute) => incompleteCoordinateLabels[attribute] === value,
            ) ?? 'any'
          ]
        }
        inputReadOnly
        options={INCOMPLETE_COORDINATE_FILTER_VALUES.map(
          (attribute) => incompleteCoordinateLabels[attribute],
        )}
        placeholder={text.filters.incompleteCoordinates}
        selectedValue={
          filters.valueFilters.incompleteCoordinates
            ? incompleteCoordinateLabels[
                filters.valueFilters.incompleteCoordinates
              ]
            : ''
        }
        setSelectedValue={(value) =>
          setFilters({
            ...filters,
            valueFilters: {
              ...filters.valueFilters,
              incompleteCoordinates:
                INCOMPLETE_COORDINATE_FILTER_VALUES.find(
                  (attribute) =>
                    incompleteCoordinateLabels[attribute] === value,
                ) ?? undefined,
            },
          })
        }
        startAdornment={<IncompleteIcon noTooltip />}
      />
    ),
  };
}

function getIncompleteLegalFilterOption({
  filters,
  setFilters,
}: {
  filters: AttributionFilters;
  setFilters: SetFilters;
}): SelectMenuOption {
  return {
    id: 'incompleteLegal',
    selected: false,
    label: (
      <ValueFilterAutocomplete
        ariaLabel={'incomplete legal information'}
        getSelectedValueLabel={(value) =>
          selectedIncompleteLegalLabels[
            INCOMPLETE_LEGAL_FILTER_VALUES.find(
              (attribute) => incompleteLegalLabels[attribute] === value,
            ) ?? 'any'
          ]
        }
        inputReadOnly
        options={INCOMPLETE_LEGAL_FILTER_VALUES.map(
          (attribute) => incompleteLegalLabels[attribute],
        )}
        placeholder={text.filters.incompleteLegal}
        selectedValue={
          filters.valueFilters.incompleteLegal
            ? incompleteLegalLabels[filters.valueFilters.incompleteLegal]
            : ''
        }
        setSelectedValue={(value) =>
          setFilters({
            ...filters,
            valueFilters: {
              ...filters.valueFilters,
              incompleteLegal:
                INCOMPLETE_LEGAL_FILTER_VALUES.find(
                  (attribute) => incompleteLegalLabels[attribute] === value,
                ) ?? undefined,
            },
          })
        }
        startAdornment={<IncompleteIcon noTooltip />}
      />
    ),
  };
}
