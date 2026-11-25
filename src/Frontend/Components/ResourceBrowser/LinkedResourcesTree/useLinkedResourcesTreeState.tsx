// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData, skipToken } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { LinkedResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import type { ResourceTreeFilters } from '../../../../ElectronBackend/api/resourceTreeFilters';
import { LINKED_RESOURCES_EXPANSION_LIMIT } from '../../../../shared/shared-constants';
import { useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { backend } from '../../../util/backendClient';

export type LinkedResourcesTreeState = {
  belowSelectedResource?: number;
  count: number;
  exceedsLimit: boolean;
  expandedIds: Array<string>;
  setExpandedIds: (values: Array<string>) => void;
  treeNodes: Array<LinkedResourceTreeNodeData>;
  expansionFilters?: ResourceTreeFilters;
};

export type LinkedResourcesTreeQueryProps = {
  enabled?: boolean;
  onAttributionUuids: Array<string>;
  onlyWritable?: boolean;
  search?: string;
};

export type LinkedResourcesTreeQueryResult = {
  data: LinkedResourcesTreeState | undefined;
  isError: boolean;
  isLoading: boolean;
};

/**
 * Beyond this many attributions, loading a tree for their combined linked
 * resources does not scale anymore (the backend probe cost multiplies with
 * the attribution count). The bound matches the attribution count query-wide
 * selections materialize at most (see QUERY_WIDE_TREE_ATTRIBUTION_LIMIT);
 * popups fall back to a resource count instead.
 */
const MAX_LINKED_TREE_ATTRIBUTION_COUNT = 100;

const noopSetExpandedIds = () => undefined;

/**
 * Reusable hook to encapsulate the linked resource tree expanded id logic
 */
export function useLinkedResourcesTree({
  onAttributionUuids,
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

  // Trees for too many attributions at once can become arbitrarily slow to
  // compute and are therefore not loaded; popups showing the tree fall back
  // to a resource count in that case.
  // Single attributions that are linked to more than
  // LINKED_RESOURCES_EXPANSION_LIMIT resources fall back to an over-limit
  // message instead of loading the tree.
  const enabled =
    enabledProp &&
    onAttributionUuids.length > 0 &&
    onAttributionUuids.length <= MAX_LINKED_TREE_ATTRIBUTION_COUNT &&
    !!onAttributionUuids[0];
  const ownerKey = useMemo(
    () => JSON.stringify([onAttributionUuids, selectedResourcePath]),
    [onAttributionUuids, selectedResourcePath],
  );
  const expansionFilters = useMemo(
    () => ({ onAttributionUuids, onlyWritable, search }),
    [onAttributionUuids, onlyWritable, search],
  );

  const expansionPaths =
    backend.getResourcePathsAndParentsForAttributions.useQuery(
      enabled
        ? {
            attributionUuids: onAttributionUuids,
            limit: LINKED_RESOURCES_EXPANSION_LIMIT,
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
      source: expansionPaths.data.paths,
      values: expansionPaths.data.paths,
    });
  }, [enabled, expansionPaths.data, ownerKey]);

  // With a search applied, the tree query only returns matching resources
  // and is cheap, so it is not skipped when the expansion limit is reached.
  const isOverLimit = !!expansionPaths.data?.limitReached && !search;

  const treeReady =
    enabled &&
    !expansionPaths.isFetching &&
    !expansionPaths.isError &&
    expansionPaths.data !== undefined &&
    expandedIds.ownerKey === ownerKey &&
    expandedIds.source === expansionPaths.data.paths;

  const resources = backend.getLinkedResourceTree.useQuery(
    treeReady && !isOverLimit
      ? {
          ...expansionFilters,
          expandedNodes: expandedIds.values,
          selectedResourcePath,
        }
      : skipToken,
    {
      placeholderData: treeReady && !isOverLimit ? keepPreviousData : undefined,
    },
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
      treeReady && isOverLimit
        ? {
            count: 0,
            exceedsLimit: true,
            expandedIds: [],
            setExpandedIds: noopSetExpandedIds,
            treeNodes: [],
            expansionFilters,
          }
        : treeReady && resources.data
          ? {
              ...resources.data,
              exceedsLimit: false,
              expansionFilters,
              expandedIds: expandedIds.values,
              setExpandedIds: updateExpandedIds,
            }
          : undefined,
    [
      expandedIds.values,
      expansionFilters,
      isOverLimit,
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
  };
}
