// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, max } from 'lodash-es';
import { useMemo, useRef } from 'react';

import type { FilterProperties } from '../../../ElectronBackend/api/queries';
import {
  INCOMPLETE_COORDINATE_FILTER_VALUES,
  INCOMPLETE_LEGAL_FILTER_VALUES,
} from '../../../shared/attribution-filters';
import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import type { AttributionFilters } from '../../state/variables/use-filters';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { useClassifications } from '../../util/use-classifications';
import type { AttributionFilterOption } from '../AttributionPanels/attribution-filter-options';
import {
  ClassificationIcon,
  CriticalityIcon,
  IncompleteIcon,
} from '../Icons/Icons';
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

const criticalityOptions = [
  { value: Criticality.None, label: 'None' },
  { value: Criticality.Medium, label: 'Medium' },
  { value: Criticality.High, label: 'High' },
];

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
  const classificationFilterOption = useClassificationFilterOption({
    filters,
    setFilters,
  });
  const criticalityFilterOption = useCriticalityFilterOption({
    filters,
    setFilters,
  });
  return useMemo(
    () =>
      compact([
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
        classificationFilterOption,
        criticalityFilterOption,
      ]),
    [
      filterOptions,
      filterProps,
      filters,
      setFilters,
      classificationFilterOption,
      criticalityFilterOption,
    ],
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

function useClassificationFilterOption({
  filters,
  setFilters,
}: {
  filters: AttributionFilters;
  setFilters: SetFilters;
}): SelectMenuOption | undefined {
  const classifications = useClassifications();
  const [userSettings] = useUserSettings();

  return useMemo(() => {
    const options = Object.entries(classifications)
      .map(([id, entry]) => ({
        value: Number(id),
        label: entry.description,
      }))
      .sort((a, b) => a.value - b.value);
    const selected = filters.valueFilters.classification;
    const maxClassification = max(options.map(({ value }) => value));

    if (
      (!userSettings.showClassifications && selected === undefined) ||
      maxClassification === undefined
    ) {
      return undefined;
    }

    return getValueFilterOption({
      field: 'classification',
      label: text.filters.classification,
      renderIcon: (value) => (
        <ClassificationIcon
          classification={value ?? maxClassification}
          noTooltip
        />
      ),
      options,
      filters,
      setFilters,
    });
  }, [classifications, filters, setFilters, userSettings.showClassifications]);
}

function useCriticalityFilterOption({
  filters,
  setFilters,
}: {
  filters: AttributionFilters;
  setFilters: SetFilters;
}): SelectMenuOption | undefined {
  const [userSettings] = useUserSettings();

  return useMemo(() => {
    if (
      !userSettings.showCriticality &&
      filters.valueFilters.criticality === undefined
    ) {
      return undefined;
    }

    return getValueFilterOption({
      field: 'criticality',
      label: text.filters.criticality,
      renderIcon: (value) => (
        <CriticalityIcon criticality={value ?? Criticality.High} noTooltip />
      ),
      options: criticalityOptions,
      filters,
      setFilters,
    });
  }, [filters, setFilters, userSettings.showCriticality]);
}

function getValueFilterOption({
  field,
  label,
  renderIcon,
  options,
  filters,
  setFilters,
}: {
  field: 'classification' | 'criticality';
  label: string;
  renderIcon: (value: number | undefined) => React.ReactNode;
  options: Array<{ value: number; label: string }>;
  filters: AttributionFilters;
  setFilters: SetFilters;
}): SelectMenuOption {
  const selected = filters.valueFilters[field];

  return {
    id: field,
    selected: false,
    label: (
      <ValueFilterAutocomplete
        ariaLabel={field}
        inputReadOnly
        options={options.map((option) => String(option.value))}
        getOptionLabel={(value) =>
          options.find((option) => option.value === Number(value))?.label ??
          value
        }
        placeholder={label}
        selectedValue={selected === undefined ? '' : String(selected)}
        setSelectedValue={(value) =>
          setFilters({
            ...filters,
            valueFilters: {
              ...filters.valueFilters,
              [field]: value === null ? undefined : Number(value),
            },
          })
        }
        startAdornment={renderIcon(selected)}
      />
    ),
  };
}
