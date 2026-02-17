// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import {
  getExpandedIds,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { useVariable } from '../../state/variables/use-variable';
import { backend } from '../../util/backendClient';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { LinkedResourcesTree } from './LinkedResourcesTree/LinkedResourcesTree';
import { ResourcesTree } from './ResourcesTree/ResourcesTree';

const ALL_RESOURCES_SEARCH = 'all-resources-search';
const LINKED_RESOURCES_SEARCH = 'linked-resources-search';

export function ResourceBrowser() {
  const [searchAll, setSearchAll] = useVariable(ALL_RESOURCES_SEARCH, '');
  const [searchLinked, setSearchLinked] = useVariable(
    LINKED_RESOURCES_SEARCH,
    '',
  );
  const debouncedSearchAll = useDebouncedInput(searchAll);
  const debouncedSearchLinked = useDebouncedInput(searchLinked);


  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedCount: number =
    backend.resourceDescendantCount.useQuery(
      { searchString: debouncedSearchAll, resourcePath: selectedResourceId },
      { placeholderData: keepPreviousData },
    ).data ?? 0;

  const { panelSizes, setPanelSizes } = usePanelSizes();

  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedLinkedCount: number =
    backend.resourceDescendantCount.useQuery(
      {
        searchString: debouncedSearchLinked,
        resourcePath: selectedResourceId,
        onAttributions: [selectedAttributionId],
      },
      { placeholderData: keepPreviousData },
    ).data ?? 0;

  const setWidth = useCallback(
    (width: number) => setPanelSizes({ resourceBrowserWidth: width }),
    [setPanelSizes],
  );

  const setHeight = useCallback(
    (height: number) => {
      setPanelSizes({
        linkedResourcesPanelHeight: height,
      });
    },
    [setPanelSizes],
  );

  const expandedIds = useAppSelector(getExpandedIds);

  const resourceTree = backend.getResourceTree.useQuery(
    {
      expandedNodes: expandedIds,
      search: debouncedSearchAll,
    },
    { placeholderData: keepPreviousData },
  );


  const linkedResourceCount = backend.getResourceCountOnAttributions.useQuery(
    {
      attributionUuids: [selectedAttributionId],
    },
    { enabled: !!selectedAttributionId, placeholderData: keepPreviousData },
  );

  return (
    <ResizePanels
      main={'upper'}
      width={panelSizes.resourceBrowserWidth}
      height={panelSizes.linkedResourcesPanelHeight}
      setWidth={setWidth}
      setHeight={setHeight}
      upperPanel={{
        title: text.resourceBrowser.allResources(
          selectedCount,
          resourceTree.data?.count ?? 0,
        ),
        search: {
          value: searchAll,
          setValue: setSearchAll,
          channel: AllowedFrontendChannels.SearchResources,
        },
        component: (
          <ResourcesTree resources={resourceTree.data?.treeNodes ?? []} />
        ),
        headerTestId: 'resources-tree-header',
      }}
      lowerPanel={{
        title: text.resourceBrowser.linkedResources(
          selectedLinkedCount,
          linkedResourceCount.data ?? 0,
        ),
        search: {
          value: searchLinked,
          setValue: setSearchLinked,
          channel: AllowedFrontendChannels.SearchLinkedResources,
        },
        hidden: !selectedAttributionId || linkedResourceCount.data === 0,
        component: (
          <LinkedResourcesTree
            attributionUuids={[selectedAttributionId]}
            search={debouncedSearchLinked}
          />
        ),
        headerTestId: 'linked-resources-tree-header',
      }}
    />
  );
}
