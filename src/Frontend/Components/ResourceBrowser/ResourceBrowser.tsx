// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import {
  getExpandedIds,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { useResourceTreeFilters } from '../../state/variables/use-filters';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { useVariable } from '../../state/variables/use-variable';
import { backend } from '../../util/backendClient';
import { useDebouncedInput } from '../../util/use-debounced-input';
import {
  FilterButton,
  type FilterButtonTriggerProps,
} from '../FilterButton/FilterButton';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { LinkedResourcesTree } from './LinkedResourcesTree/LinkedResourcesTree';
import { useLinkedResourcesTreeState } from './LinkedResourcesTree/useLinkedResourcesTreeState';
import { FilterIconButton } from './ResourceBrowser.style';
import { ResourcesTree } from './ResourcesTree/ResourcesTree';

const ALL_RESOURCES_SEARCH = 'all-resources-search';
const LINKED_RESOURCES_SEARCH = 'linked-resources-search';

function renderResourceBrowserFilterTrigger({
  content,
  disabled,
  isSomeFilterActive,
  onClick,
}: FilterButtonTriggerProps) {
  return (
    <FilterIconButton
      aria-label={'filter button'}
      onClick={onClick}
      disabled={disabled}
      isFilterActive={isSomeFilterActive}
      size={'small'}
    >
      {content}
    </FilterIconButton>
  );
}

export function ResourceBrowser() {
  const { panelSizes, setPanelSizes } = usePanelSizes();

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

  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  // All resources
  const [resourceTreeFilters] = useResourceTreeFilters();
  const { selectedLicense: resourceTreeSelectedLicense } = resourceTreeFilters;
  const [searchAll, setSearchAll] = useVariable(ALL_RESOURCES_SEARCH, '');
  const debouncedSearchAll = useDebouncedInput(searchAll);
  const expandedIdsAll = useAppSelector(getExpandedIds);
  const resourceTreeAttributionsWithSelectedLicense =
    backend.listAttributions.useQuery(
      {
        external: false,
        license: resourceTreeSelectedLicense,
      },
      { enabled: !!resourceTreeSelectedLicense },
    );
  const resourceTreeAttributionUuids = useMemo(
    () =>
      resourceTreeSelectedLicense
        ? Object.keys(resourceTreeAttributionsWithSelectedLicense.data ?? {})
        : undefined,
    [
      resourceTreeSelectedLicense,
      resourceTreeAttributionsWithSelectedLicense.data,
    ],
  );
  const resourceTreeAll = backend.getResourceTree.useQuery(
    {
      expandedNodes: expandedIdsAll,
      onAttributionUuids: resourceTreeAttributionUuids,
      search: debouncedSearchAll,
      selectedResourcePath: selectedResourceId,
    },
    { placeholderData: keepPreviousData },
  );

  // Linked resources
  const [searchLinked, setSearchLinked] = useVariable(
    LINKED_RESOURCES_SEARCH,
    '',
  );
  const debouncedSearchLinked = useDebouncedInput(searchLinked);
  const onAttributionUuids = useMemo(
    () => [selectedAttributionId],
    [selectedAttributionId],
  );
  const linkedResourcesTreeState = useLinkedResourcesTreeState({
    onAttributionUuids,
    search: debouncedSearchLinked,
  });

  return (
    <ResizePanels
      main={'upper'}
      width={panelSizes.resourceBrowserWidth}
      height={panelSizes.linkedResourcesPanelHeight}
      setWidth={setWidth}
      setHeight={setHeight}
      upperPanel={{
        title: resourceTreeAll.data
          ? text.resourceBrowser.allResources(
              resourceTreeAll.data.belowSelectedResource ?? 0,
              resourceTreeAll.data.count,
            )
          : '',
        search: {
          value: searchAll,
          setValue: setSearchAll,
          channel: AllowedFrontendChannels.SearchResources,
        },
        headerActions: (
          <FilterButton
            mode={'resourceTree'}
            useFilteredData={useResourceTreeFilters}
            availableFilters={[]}
            anchorPosition={'right'}
            badgeColor={'secondary'}
            renderTrigger={renderResourceBrowserFilterTrigger}
          />
        ),
        component: (
          <ResourcesTree resources={resourceTreeAll.data?.treeNodes ?? []} />
        ),
        headerTestId: 'resources-tree-header',
      }}
      lowerPanel={{
        title: linkedResourcesTreeState
          ? text.resourceBrowser.linkedResources(
              linkedResourcesTreeState.belowSelectedResource ?? 0,
              linkedResourcesTreeState.count,
            )
          : '',
        search: {
          value: searchLinked,
          setValue: setSearchLinked,
          channel: AllowedFrontendChannels.SearchLinkedResources,
        },
        hidden: !linkedResourcesTreeState,
        component: <LinkedResourcesTree state={linkedResourcesTreeState} />,
        headerTestId: 'linked-resources-tree-header',
      }}
    />
  );
}
