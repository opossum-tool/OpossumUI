// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ATTRIBUTION_FILTERS, ROOT_PATH } from '../../shared-constants';
import { useFilteredAttributionsInReportView } from '../../state/variables/use-filtered-data';
import { backend } from '../../util/backendClient';
import { useFilteredReportsAttributionsList } from '../../util/use-attribution-lists';
import { FilterButton } from '../FilterButton/FilterButton';

export const TableFilterButton: React.FC = () => {
  const [{ filters }] = useFilteredAttributionsInReportView();

  const filterProps = backend.filterProperties.useQuery({
    external: false,
    filters,
    resourcePathForRelationships: ROOT_PATH,
  });

  const { attributions, loading } = useFilteredReportsAttributionsList();

  return (
    <FilterButton
      filterProps={filterProps.data?.descendant}
      availableFilters={ATTRIBUTION_FILTERS}
      anchorPosition={'left'}
      useFilteredData={useFilteredAttributionsInReportView}
      disabled={loading}
      emptyAttributions={
        !!attributions && Object.keys(attributions).length === 0
      }
    />
  );
};
