// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ROOT_PATH } from '../shared-constants';
import { useAppSelector } from '../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../state/selectors/resource-selectors';
import {
  useFilteredAttributions,
  useFilteredAttributionsInReportView,
  useFilteredSignals,
} from '../state/variables/use-filtered-data';
import { useUserSettings } from '../state/variables/use-user-setting';
import { backend } from './backendClient';

export function useFilteredAttributionsList({
  external,
}: {
  external: boolean;
}) {
  const useFilteredData = external
    ? useFilteredSignals
    : useFilteredAttributions;

  const [{ filters, search, selectedLicense, sorting }] = useFilteredData();

  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;

  const attributionQuery = backend.listAttributions.useQuery({
    external,
    filters,
    search,
    sort: sorting,
    license: selectedLicense,
    resourcePathForRelationships: selectedResourceId,
    showResolved: areHiddenSignalsVisible,
    excludeUnrelated: external,
  });

  const attributions = attributionQuery.data ?? null;
  const loading = attributionQuery.isLoading;

  return { attributions, loading };
}

export function useIsSelectedAttributionVisible() {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const { attributions } = useFilteredAttributionsList({ external: false });
  const { attributions: signals } = useFilteredAttributionsList({
    external: true,
  });

  return (
    !!attributions?.[selectedAttributionId] ||
    !!signals?.[selectedAttributionId]
  );
}

export function useFilteredReportsAttributionsList() {
  const [{ filters }] = useFilteredAttributionsInReportView();

  const attributionQuery = backend.listAttributions.useQuery({
    external: false,
    filters,
    resourcePathForRelationships: ROOT_PATH,
  });

  const attributions = attributionQuery.data ?? null;
  const loading = attributionQuery.isLoading;

  return { attributions, loading };
}
