// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ROOT_PATH } from '../shared-constants';
import { useAppSelector } from '../state/hooks';
import { getSelectedResourceId } from '../state/selectors/resource-selectors';
import {
  useAttributionFiltersInReportView,
  useExternalAttributionFilters,
  useManualAttributionFilters,
} from '../state/variables/use-filters';
import { useUserSettings } from '../state/variables/use-user-setting';
import { backend } from './backendClient';

export function useFilteredAttributionsList({
  external,
}: {
  external: boolean;
}) {
  const useFilters = external
    ? useExternalAttributionFilters
    : useManualAttributionFilters;

  const [{ filters, search, valueFilters, sorting }] = useFilters();

  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;

  const attributionQuery = backend.listAttributions.useQuery({
    external,
    filters,
    search,
    sort: sorting,
    valueFilters,
    resourcePathForRelationships: selectedResourceId,
    showResolved: areHiddenSignalsVisible && external,
    excludeUnrelated: external,
  });

  const attributions = attributionQuery.data ?? null;
  const loading = attributionQuery.isLoading;

  return { attributions, loading };
}

export function useFilteredReportsAttributionsList() {
  const [{ filters, valueFilters }] = useAttributionFiltersInReportView();

  const attributionQuery = backend.listAttributions.useQuery({
    external: false,
    filters,
    resourcePathForRelationships: ROOT_PATH,
    valueFilters,
  });

  const attributions = attributionQuery.data ?? null;
  const loading = attributionQuery.isLoading;

  return { attributions, loading };
}
