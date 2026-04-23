// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ATTRIBUTION_FILTERS } from '../../shared-constants';
import { useAttributionFiltersInReportView } from '../../state/variables/use-filters';
import { useFilteredReportsAttributionsList } from '../../util/use-attribution-lists';
import { FilterButton } from '../FilterButton/FilterButton';

export const TableFilterButton: React.FC = () => {
  const { attributions, loading } = useFilteredReportsAttributionsList();

  return (
    <FilterButton
      mode="reportTable"
      availableFilters={ATTRIBUTION_FILTERS}
      anchorPosition={'left'}
      useFilteredData={useAttributionFiltersInReportView}
      disabled={loading}
      emptyAttributions={
        !!attributions && Object.keys(attributions).length === 0
      }
    />
  );
};
