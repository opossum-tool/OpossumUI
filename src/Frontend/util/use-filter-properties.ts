// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData } from '@tanstack/react-query';

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

export type FilterPropsMode = 'external' | 'manual' | 'reportTable';

export function useFilterProperties({
  mode,
  enabled,
}: {
  mode: FilterPropsMode;
  enabled?: boolean;
}) {
  const useFilters = {
    manual: useManualAttributionFilters,
    external: useExternalAttributionFilters,
    reportTable: useAttributionFiltersInReportView,
  }[mode];

  const [{ filters, search, selectedLicense }] = useFilters();

  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;

  const filterPropsQuery = backend.filterProperties.useQuery(
    {
      external: mode === 'external',
      filters,
      search: mode === 'reportTable' ? undefined : search,
      license: mode === 'reportTable' ? undefined : selectedLicense,
      resourcePathForRelationships:
        mode === 'reportTable' ? ROOT_PATH : selectedResourceId,
      showResolved: mode === 'external' ? areHiddenSignalsVisible : undefined,
    },
    { enabled, placeholderData: keepPreviousData },
  );

  const shownRelation = (
    {
      manual: 'all',
      external: 'sameOrDescendant',
      reportTable: 'descendant',
    } as const
  )[mode];

  const filterProps = filterPropsQuery.data?.[shownRelation] ?? null;
  const loading = filterPropsQuery.isLoading;

  return { filterProps, loading };
}
