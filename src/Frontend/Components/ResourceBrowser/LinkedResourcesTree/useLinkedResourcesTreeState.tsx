// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData, skipToken } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { OnAttributionInput } from '../../../../ElectronBackend/api/resource-tree-on-attributions';
import type { LinkedResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import type { ResourceTreeFiltersInput } from '../../../../ElectronBackend/api/resourceTreeFilters';
import { useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { backend } from '../../../util/backendClient';

export type LinkedResourcesTreeState = {
  belowSelectedResource?: number;
  count: number;
  expandedIds: Array<string>;
  setExpandedIds: (values: Array<string>) => void;
  treeNodes: Array<LinkedResourceTreeNodeData>;
  expansionFilters?: ResourceTreeFiltersInput;
};

export type LinkedResourcesTreeQueryProps = {
  onAttribution: OnAttributionInput;
  additionalAttributionUuids?: Array<string>;
  attributionLimit?: number;
  enabled?: boolean;
  onlyWritable?: boolean;
  search?: string;
};

export type LinkedResourcesTreeQueryResult = {
  data: LinkedResourcesTreeState | undefined;
  isError: boolean;
  isLoading: boolean;
  limitExceeded?: boolean;
};

/**
 * Reusable hook to encapsulate the linked resource tree expanded id logic
 */
export function useLinkedResourcesTree({
  onAttribution,
  additionalAttributionUuids,
  attributionLimit,
  search,
  onlyWritable = false,
  enabled: enabledProp = true,
}: LinkedResourcesTreeQueryProps): LinkedResourcesTreeQueryResult {
  const selectedResourcePath = useAppSelector(getSelectedResourceId);

  const [expandedIds, setExpandedIds] = useState<{
    ownerKey: string;
    source: Array<string> | undefined;
    values: Array<string>;
  }>({ ownerKey: '', source: undefined, values: [] });

  const hasAttributions = Array.isArray(onAttribution)
    ? onAttribution.length > 0 || (additionalAttributionUuids?.length ?? 0) > 0
    : true;
  const enabled = enabledProp && hasAttributions;
  const ownerKey = useMemo(
    () =>
      JSON.stringify([
        onAttribution,
        additionalAttributionUuids,
        selectedResourcePath,
      ]),
    [onAttribution, additionalAttributionUuids, selectedResourcePath],
  );
  const expansionFilters = useMemo(
    () => ({
      onAttribution,
      additionalAttributionUuids,
      attributionLimit,
      onlyWritable,
      search,
    }),
    [
      onAttribution,
      additionalAttributionUuids,
      attributionLimit,
      onlyWritable,
      search,
    ],
  );

  const expansionPaths =
    backend.getResourcePathsAndParentsForAttributions.useQuery(
      enabled
        ? {
            onAttribution,
            additionalAttributionUuids,
            attributionLimit,
            limit: 1000,
            prioritizedResourcePath: selectedResourcePath,
          }
        : skipToken,
    );
  const limitExceeded = expansionPaths.data?.limitExceeded;
  const expansionNodePaths = expansionPaths.data?.resourcePaths;

  useEffect(() => {
    if (
      !enabled ||
      limitExceeded ||
      expansionPaths.isError ||
      expansionNodePaths === undefined
    ) {
      return;
    }

    setExpandedIds({
      ownerKey,
      source: expansionNodePaths,
      values: expansionNodePaths,
    });
  }, [
    enabled,
    limitExceeded,
    expansionPaths.isError,
    expansionNodePaths,
    ownerKey,
  ]);

  const treeReady =
    enabled &&
    !limitExceeded &&
    !expansionPaths.isFetching &&
    !expansionPaths.isError &&
    expansionNodePaths !== undefined &&
    expandedIds.ownerKey === ownerKey &&
    expandedIds.source === expansionNodePaths;

  const resources = backend.getLinkedResourceTree.useQuery(
    treeReady
      ? {
          ...expansionFilters,
          expandedNodes: expandedIds.values,
          selectedResourcePath,
        }
      : skipToken,
    { placeholderData: treeReady ? keepPreviousData : undefined },
  );

  const updateExpandedIds = useCallback(
    (values: Array<string>) =>
      setExpandedIds({
        ownerKey,
        source: expandedIds.source,
        values,
      }),
    [expandedIds.source, ownerKey],
  );
  const state = useMemo(
    () =>
      treeReady && resources.data
        ? {
            ...resources.data,
            expansionFilters,
            expandedIds: expandedIds.values,
            setExpandedIds: updateExpandedIds,
          }
        : undefined,
    [
      expandedIds.values,
      expansionFilters,
      resources.data,
      treeReady,
      updateExpandedIds,
    ],
  );

  return {
    isError: enabled && (expansionPaths.isError || resources.isError),
    isLoading:
      enabled &&
      !expansionPaths.isError &&
      !resources.isError &&
      (!treeReady || resources.isFetching),
    data: state,
    limitExceeded,
  };
}
