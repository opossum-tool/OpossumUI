// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import {
  getResourceIds,
  getResourceIdsOfSelectedAttribution,
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
  const resourceIds = useAppSelector(getResourceIds);

  const isSelectedAttributionVisible = useIsSelectedAttributionVisible();

  const [searchAll, setSearchAll] = useVariable(ALL_RESOURCES_SEARCH, '');
  const [searchLinked, setSearchLinked] = useVariable(
    LINKED_RESOURCES_SEARCH,
    '',
  );
  const debouncedSearchAll = useDebouncedInput(searchAll);
  const debouncedSearchLinked = useDebouncedInput(searchLinked);
  const { panelSizes, setPanelSizes } = usePanelSizes();

  const allResourcesFiltered = useMemo(
    () =>
      resourceIds?.filter((path) =>
        path.toLowerCase().includes(debouncedSearchAll),
      ),
    [resourceIds, debouncedSearchAll],
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

  if (!allResourcesFiltered) {
    return null;
  }

  return (
    <ResizePanels
      main={'upper'}
      width={panelSizes.resourceBrowserWidth}
      height={panelSizes.linkedResourcesPanelHeight}
      setWidth={setWidth}
      setHeight={setHeight}
      upperPanel={{
        title: text.resourceBrowser.allResources(allResourcesFiltered.length),
        search: {
          value: searchAll,
          setValue: setSearchAll,
          channel: AllowedFrontendChannels.SearchResources,
        },
        component: <ResourcesTree resourceIds={allResourcesFiltered} />,
        headerTestId: 'resources-tree-header',
      }}
      lowerPanel={{
        title: text.resourceBrowser.linkedResources(
          linkedResourcesFiltered.length,
        ),
        search: {
          value: searchLinked,
          setValue: setSearchLinked,
          channel: AllowedFrontendChannels.SearchLinkedResources,
        },
        hidden: !resourceIdsOfSelectedAttribution.length,
        component: (
          <LinkedResourcesTree resourceIds={linkedResourcesFiltered} />
        ),
        headerTestId: 'linked-resources-tree-header',
      }}
    />
  );
}
