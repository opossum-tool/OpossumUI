// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ROOT_PATH } from '../shared-constants';
import { useAttributionFiltersInReportView } from '../state/variables/use-filters';
import { backend } from './backendClient';

export function useFilteredReportsAttributionsList() {
  const [{ filters, valueFilters }] = useAttributionFiltersInReportView();

  const attributionQuery = backend.listAttributions.useQuery({
    external: false,
    filters,
    resourcePathForRelationships: ROOT_PATH,
    valueFilters,
  });

  const attributions = attributionQuery.data ?? null;
  const loading =
    attributionQuery.isLoading || attributionQuery.isPlaceholderData;

  return { attributions, loading };
}
