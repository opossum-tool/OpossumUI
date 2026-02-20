// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { getInitialExpandedIds } from '../../../state/helpers/resources-helpers';
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
  enabled: enabledProp = true,
}: {
  onAttributionUuids: Array<string>;
  search?: string;
  enabled?: boolean;
}) {
  const selectedResourcePath = useAppSelector(getSelectedResourceId);

  const [expandedIds, setExpandedIds] = useState<Array<string>>([]);

  const hasAttributionUuids =
    onAttributionUuids &&
    onAttributionUuids.length > 0 &&
    !!onAttributionUuids[0];
  const enabled = enabledProp && hasAttributionUuids;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    async function fetchExpandedIds() {
      const ids = await getInitialExpandedIds(
        onAttributionUuids,
        selectedResourcePath,
      );
      setExpandedIds(ids);
    }
    void fetchExpandedIds();
  }, [enabled, onAttributionUuids, selectedResourcePath]);

  const resources = backend.getResourceTree.useQuery(
    {
      expandedNodes: expandedIds,
      search,
      onAttributionUuids,
      selectedResourcePath,
    },
    { placeholderData: keepPreviousData, enabled },
  );

  if (!enabled || !resources.data) {
    return undefined;
  }

  return { ...resources.data, expandedIds, setExpandedIds };
}
