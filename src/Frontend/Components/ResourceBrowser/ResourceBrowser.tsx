// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo } from 'react';

import { text } from '../../../shared/text';
import { getPathsFromResources } from '../../state/helpers/resources-helpers';
import { useAppSelector } from '../../state/hooks';
import {
  getResourceIdsOfSelectedAttribution,
  getResources,
} from '../../state/selectors/resource-selectors';
import { useIsSelectedAttributionVisible } from '../../state/variables/use-filtered-data';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { useVariable } from '../../state/variables/use-variable';
import { useDebouncedInput } from '../../util/use-debounced-input';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { LinkedResourcesTree } from './LinkedResourcesTree/LinkedResourcesTree';
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
  const [{ resourceBrowserWidth, linkedResourcesPanelHeight }, setPanelSizes] =
    usePanelSizes();

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

  const setWidth = useCallback(
    (width: number) =>
      setPanelSizes((prev) => ({ ...prev, resourceBrowserWidth: width })),
    [setPanelSizes],
  );

  const setHeight = useCallback(
    (height: number) => {
      setPanelSizes((prev) => ({
        ...prev,
        linkedResourcesPanelHeight: height,
      }));
    },
    [setPanelSizes],
  );

  return (
    <ResizePanels
      main={'upper'}
      width={resourceBrowserWidth}
      height={linkedResourcesPanelHeight}
      setWidth={setWidth}
      setHeight={setHeight}
      upperPanel={{
        title: text.resourceBrowser.allResources(allResourcesFiltered.length),
        search: searchAll,
        setSearch: setSearchAll,
        component: <ResourcesTree resourceIds={allResourcesFiltered} />,
      }}
      lowerPanel={{
        title: text.resourceBrowser.linkedResources(
          linkedResourcesFiltered.length,
        ),
        search: searchLinked,
        setSearch: setSearchLinked,
        hidden: !resourceIdsOfSelectedAttribution.length,
        component: (
          <LinkedResourcesTree resourceIds={linkedResourcesFiltered} />
        ),
      }}
    />
  );
}
