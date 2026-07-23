// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAttributionFiltersInReportView } from '../../state/variables/use-filters';
import { useFilteredReportsAttributionsList } from '../../util/use-attribution-lists';
import { useFilterProperties } from '../../util/use-filter-properties';
import { attributionFilterOptions } from '../AttributionPanels/attribution-filter-options';
import { FilterButton } from '../FilterButton/FilterButton';
import { useAttributionFilterOptions } from '../FilterButton/use-attribution-filter-options';

export const TableFilterButton: React.FC = () => {
  const { attributions, loading } = useFilteredReportsAttributionsList();
  const { filterProps } = useFilterProperties({ mode: 'reportTable' });
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
      onClear={() =>
        setFilteredAttributions({
          ...filters,
          filters: [],
          valueFilters: {},
        })
      }
      anchorPosition={'left'}
      disabled={
        loading ||
        (!!attributions &&
          Object.keys(attributions).length === 0 &&
          !isFilterActive)
      }
    />
  );
};
