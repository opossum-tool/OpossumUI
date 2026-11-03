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
import { useIsSelectedResourceReadonly } from './use-selected-resource';

export type FilterPropsMode = 'external' | 'manual' | 'reportTable';

type FilterPropertiesRelation =
  'same' | 'descendant' | 'ancestor' | 'unrelated' | 'all' | 'sameOrDescendant';

const RELATION_TO_FILTER_PROPERTIES_RELATION: Record<
  'resource' | 'children' | 'parents' | 'unrelated',
  FilterPropertiesRelation
> = {
  resource: 'same',
  children: 'descendant',
  parents: 'ancestor',
  unrelated: 'unrelated',
};

export function useFilterProperties({
  mode,
  enabled,
  relation,
}: {
  mode: FilterPropsMode;
  enabled?: boolean;
  /** The relation the panel currently displays; counts are scoped to it. */
  relation?: 'resource' | 'children' | 'parents' | 'unrelated';
}) {
  const useFilters = {
    manual: useManualAttributionFilters,
    external: useExternalAttributionFilters,
    reportTable: useAttributionFiltersInReportView,
  }[mode];

  const [{ filters, search, valueFilters }] = useFilters();

  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();

  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;

  const filterPropsQuery = backend.filterProperties.useQuery(
    {
      external: mode === 'external',
      filters,
      search: mode === 'reportTable' ? undefined : search,
      valueFilters,
      resourcePathForRelationships:
        mode === 'reportTable' ? ROOT_PATH : selectedResourceId,
      showResolved: mode === 'external' ? areHiddenSignalsVisible : undefined,
      includeReadonly: mode !== 'reportTable',
      excludeUnrelated:
        mode === 'external' ||
        (mode !== 'reportTable' && isSelectedResourceReadonly),
    },
    { enabled, placeholderData: keepPreviousData },
  );

  // The report table lists every attribution in the project, so 'all' matches
  // what it displays. The audit panels display one relation at a time; scope
  // their counts to the displayed relation so menu counts match the list.
  const shownRelation: FilterPropertiesRelation =
    mode === 'manual' && relation
      ? RELATION_TO_FILTER_PROPERTIES_RELATION[relation]
      : (
          {
            manual: 'all',
            external: 'sameOrDescendant',
            reportTable: 'all',
          } as const
        )[mode];

  const filterProps = filterPropsQuery.data?.[shownRelation] ?? null;
  const loading = filterPropsQuery.isLoading;

  return { filterProps, loading };
}

export function useResourceTreeFilterProperties({
  enabled,
  external,
}: {
  enabled?: boolean;
  external: boolean;
}) {
  const filterPropsQuery = backend.filterProperties.useQuery(
    {
      external,
      filters: [],
      resourcePathForRelationships: ROOT_PATH,
      includeReadonly: true,
    },
    { enabled, placeholderData: keepPreviousData },
  );

  return {
    filterProps: filterPropsQuery.data?.all ?? null,
    loading: filterPropsQuery.isLoading,
  };
}
