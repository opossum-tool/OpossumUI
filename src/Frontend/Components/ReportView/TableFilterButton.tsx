// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';

import { useAttributionFiltersInReportView } from '../../state/variables/use-filters';
import { useFilterProperties } from '../../util/use-filter-properties';
import { attributionFilterOptions } from '../AttributionPanels/attribution-filter-options';
import { FilterButton } from '../FilterButton/FilterButton';
import { useAttributionFilterOptions } from '../FilterButton/use-attribution-filter-options';

export const TableFilterButton: React.FC<{
  loading: boolean;
  empty: boolean;
}> = ({ loading, empty }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filterProps } = useFilterProperties({
    mode: 'reportTable',
    enabled: isFilterOpen,
  });
  const [filters, setFilteredAttributions] =
    useAttributionFiltersInReportView();
  const { filters: attributionFilters, valueFilters } = filters;
  const filterOptions = useAttributionFilterOptions({
    filterOptions: attributionFilterOptions,
    filterProps,
    filters,
    setFilters: setFilteredAttributions,
  });
  const isFilterActive =
    !!attributionFilters.length || Object.values(valueFilters).some(Boolean);

  return (
    <FilterButton
      options={filterOptions}
      isActive={isFilterActive}
      onOpenChange={setIsFilterOpen}
      onClear={() =>
        setFilteredAttributions({
          ...filters,
          filters: [],
          valueFilters: {},
        })
      }
      anchorPosition={'left'}
      disabled={loading || (empty && !isFilterActive)}
    />
  );
};
