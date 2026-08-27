// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionResultSetCriteria } from '../../shared/attribution-result-set';
import { ROOT_PATH } from '../shared-constants';
import { useAppSelector } from '../state/hooks';
import { getSelectedAttributionId } from '../state/selectors/resource-selectors';
import { useAttributionFiltersInReportView } from '../state/variables/use-filters';
import { useAttributionPages } from './use-attribution-pages';

export function useReportAttributionsList() {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const [{ filters, valueFilters, sorting }] =
    useAttributionFiltersInReportView();
  const criteria: AttributionResultSetCriteria = {
    external: false,
    filters,
    search: '',
    resourcePathForRelationships: ROOT_PATH,
    showResolved: false,
    excludeUnrelated: false,
    valueFilters,
  };
  return useAttributionPages({
    criteria,
    scope: { mode: 'all' },
    sort: sorting,
    includeReadonly: false,
    targetAttributionUuid: selectedAttributionId || undefined,
    navigationScope: 'all',
  });
}
