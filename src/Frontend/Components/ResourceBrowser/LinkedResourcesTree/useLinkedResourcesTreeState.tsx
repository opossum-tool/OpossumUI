// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData, skipToken } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { backend } from '../../../util/backendClient';

export type LinkedResourcesTreeState = ReturnType<
  typeof useLinkedResourcesTreeState
>;

/**
 * Reusable hook to encapsulate the linked resource tree expanded id logic
 */
export function useLinkedResourcesTreeState({
  onAttributionUuids,
  search,
  onlyWritable = false,
  enabled: enabledProp = true,
}: {
  onAttributionUuids: Array<string>;
  search?: string;
  onlyWritable?: boolean;
  enabled?: boolean;
}) {
  const selectedResourcePath = useAppSelector(getSelectedResourceId);

  const [expandedIds, setExpandedIds] = useState<{
    ownerKey: string;
    source: Array<string> | undefined;
    values: Array<string>;
  }>({ ownerKey: '', source: undefined, values: [] });

  const hasAttributionUuids =
    onAttributionUuids.length > 0 && !!onAttributionUuids[0];
  const enabled = enabledProp && hasAttributionUuids;
  const ownerKey = useMemo(
    () => JSON.stringify([onAttributionUuids, selectedResourcePath]),
    [onAttributionUuids, selectedResourcePath],
  );

  const expansionPaths =
    backend.getResourcePathsAndParentsForAttributions.useQuery(
      enabled
        ? {
            attributionUuids: onAttributionUuids,
            limit: 1000,
            prioritizedResourcePath: selectedResourcePath,
          }
        : skipToken,
    );

  useEffect(() => {
    if (!enabled || expansionPaths.data === undefined) {
      return;
    }

    setExpandedIds({
      ownerKey,
      source: expansionPaths.data,
      values: expansionPaths.data,
    });
  }, [enabled, expansionPaths.data, ownerKey]);

  const treeReady =
    enabled &&
    !expansionPaths.isFetching &&
    !expansionPaths.isError &&
    expansionPaths.data !== undefined &&
    expandedIds.ownerKey === ownerKey &&
    expandedIds.source === expansionPaths.data;

  const resources = backend.getResourceTree.useQuery(
    treeReady
      ? {
          expandedNodes: expandedIds.values,
          search,
          onAttributionUuids,
          selectedResourcePath,
          onlyWritable,
        }
      : skipToken,
    { placeholderData: treeReady ? keepPreviousData : undefined },
  );

  if (!treeReady || !resources.data) {
    return undefined;
  }

  return {
    ...resources.data,
    expandedIds: expandedIds.values,
    setExpandedIds: (values: Array<string>) =>
      setExpandedIds({
        ownerKey,
        source: expandedIds.source,
        values,
      }),
  };
}
