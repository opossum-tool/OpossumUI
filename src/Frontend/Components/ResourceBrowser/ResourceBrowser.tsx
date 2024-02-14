// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { text } from '../../../shared/text';
import { getPathsFromResources } from '../../state/helpers/resources-helpers';
import { useAppSelector } from '../../state/hooks';
import {
  getResourceIdsOfSelectedAttribution,
  getResources,
} from '../../state/selectors/resource-selectors';
import { useIsSelectedAttributionVisible } from '../../state/variables/use-filtered-data';
import { useVariable } from '../../state/variables/use-variable';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { usePanelSizes } from '../../util/use-panel-sizes';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { LinkedResourcesTree } from './LinkedResourcesTree/LinkedResourcesTree';
import { Panel, SearchInput } from './ResourceBrowser.style';
import { ResourcesTree } from './ResourcesTree/ResourcesTree';

const ALL_RESOURCES_SEARCH = 'all-resources-search';
const LINKED_RESOURCES_SEARCH = 'linked-resources-search';

export function ResourceBrowser() {
  const resourceIdsOfSelectedAttribution = useAppSelector(
    getResourceIdsOfSelectedAttribution,
  );
  const resources = useAppSelector(getResources);
  const allPaths = useMemo(
    () => getPathsFromResources(resources ?? {}),
    [resources],
  );

  const isSelectedAttributionVisible = useIsSelectedAttributionVisible();

  const [searchAll, setSearchAll] = useVariable(ALL_RESOURCES_SEARCH, '');
  const [searchLinked, setSearchLinked] = useVariable(
    LINKED_RESOURCES_SEARCH,
    '',
  );
  const debouncedSearchAll = useDebouncedInput(searchAll);
  const debouncedSearchLinked = useDebouncedInput(searchLinked);
  const {
    resourceBrowserWidth,
    setResourceBrowserWidth,
    linkedResourcesPanelHeight,
    setLinkedResourcesPanelHeight,
  } = usePanelSizes();

  const allResourcesFiltered = useMemo(
    () =>
      allPaths.filter((path) =>
        path.toLowerCase().includes(debouncedSearchAll),
      ),
    [allPaths, debouncedSearchAll],
  );
  const linkedResourcesFiltered = useMemo(
    () =>
      isSelectedAttributionVisible
        ? resourceIdsOfSelectedAttribution.filter((path) =>
            path.toLowerCase().includes(debouncedSearchLinked),
          )
        : [],
    [
      isSelectedAttributionVisible,
      resourceIdsOfSelectedAttribution,
      debouncedSearchLinked,
    ],
  );

  return (
    <ResizePanels
      main={'upper'}
      width={resourceBrowserWidth}
      height={linkedResourcesPanelHeight}
      setWidth={setResourceBrowserWidth}
      setHeight={setLinkedResourcesPanelHeight}
      upperPanel={{
        component: (
          <Panel>
            <SearchInput
              onInputChange={setSearchAll}
              search={searchAll}
              placeholder={text.resourceBrowser.searchAllPlaceholder}
            />
            <ResourcesTree
              resourceIds={allResourcesFiltered}
              sx={{ height: 'calc(100% - 36px)' }}
            />
          </Panel>
        ),
        title: text.resourceBrowser.allResources(allResourcesFiltered.length),
      }}
      lowerPanel={{
        component: (
          <Panel>
            <SearchInput
              onInputChange={setSearchLinked}
              search={searchLinked}
              placeholder={text.resourceBrowser.searchLinkedPlaceholder}
            />
            <LinkedResourcesTree
              resourceIds={linkedResourcesFiltered}
              sx={{ height: 'calc(100% - 36px)' }}
            />
          </Panel>
        ),
        title: text.resourceBrowser.linkedResources(
          linkedResourcesFiltered.length,
        ),
        hidden: !resourceIdsOfSelectedAttribution.length,
      }}
    />
  );
}
