// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ATTRIBUTION_FILTERS, ROOT_PATH } from '../../shared-constants';
import { useFilteredAttributionsInReportView } from '../../state/variables/use-filtered-data';
import { backend } from '../../util/backendClient';
import { FilterButton } from '../FilterButton/FilterButton';

export const TableFilterButton: React.FC = () => {
  const [{ filters }] = useFilteredAttributionsInReportView();

  const filterProps = backend.filterProperties.useQuery({
    external: false,
    filters,
    resourcePathForRelationships: ROOT_PATH,
  });

  return (
    <FilterButton
      filterProps={filterProps.data?.descendant}
      availableFilters={ATTRIBUTION_FILTERS}
      anchorPosition={'left'}
      useFilteredData={useFilteredAttributionsInReportView}
    />
  );
};
