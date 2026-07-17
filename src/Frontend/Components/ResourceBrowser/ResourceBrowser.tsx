// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';

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
import { useResourceTreeFilterProperties } from '../../util/use-filter-properties';
import { FilterButton } from '../FilterButton/FilterButton';
import { LicenseAutocomplete } from '../FilterButton/LicenseAutocomplete/LicenseAutocomplete';
import { UnreviewedIcon } from '../Icons/Icons';
import { ResizePanels } from '../ResizePanels/ResizePanels';
import { LinkedResourcesTree } from './LinkedResourcesTree/LinkedResourcesTree';
import { useLinkedResourcesTreeState } from './LinkedResourcesTree/useLinkedResourcesTreeState';
import { resourceBrowserFilterButtonStyle } from './ResourceBrowser.style';
import { ResourcesTree } from './ResourcesTree/ResourcesTree';

const ALL_RESOURCES_SEARCH = 'all-resources-search';
const LINKED_RESOURCES_SEARCH = 'linked-resources-search';
const isLicenseFilterBasedOnExternalAttributions = false;

export function ResourceBrowser() {
  const { panelSizes, setPanelSizes } = usePanelSizes();
  const licenseInputRef = useRef<HTMLInputElement>(null);

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
  const [
    { onlyUnreviewedFiles, selectedLicense: resourceTreeSelectedLicense },
    setResourceTreeFilters,
  ] = useResourceTreeFilters();
  const [searchAll, setSearchAll] = useVariable(ALL_RESOURCES_SEARCH, '');
  const debouncedSearchAll = useDebouncedInput(searchAll);
  const expandedIdsAll = useAppSelector(getExpandedIds);
  const resourceTreeLicenseFilter = resourceTreeSelectedLicense
    ? {
        licenseName: resourceTreeSelectedLicense,
        external: isLicenseFilterBasedOnExternalAttributions,
      }
    : undefined;
  const resourceTreeAll = backend.getResourceTree.useQuery(
    {
      expandedNodes: expandedIdsAll,
      licenseFilter: resourceTreeLicenseFilter,
      onlyUnreviewedFiles,
      search: debouncedSearchAll,
      selectedResourcePath: selectedResourceId,
    },
    { placeholderData: keepPreviousData },
  );
  const unreviewedFileCountQuery =
    backend.getResourceTreeUnreviewedCount.useQuery(
      {
        licenseFilter: resourceTreeLicenseFilter,
        search: debouncedSearchAll,
      },
      { placeholderData: keepPreviousData },
    );
  const { filterProps } = useResourceTreeFilterProperties({
    external: isLicenseFilterBasedOnExternalAttributions,
  });
  const isResourceTreeFilterActive =
    onlyUnreviewedFiles || !!resourceTreeSelectedLicense;
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
            options={[
              {
                id: 'unreviewed',
                selected: onlyUnreviewedFiles,
                faded: !unreviewedFileCountQuery.data,
                label:
                  unreviewedFileCountQuery.data === undefined
                    ? text.filters.unreviewed
                    : `${text.filters.unreviewed} (${new Intl.NumberFormat().format(unreviewedFileCountQuery.data)})`,
                icon: <UnreviewedIcon noTooltip />,
                onAdd: () =>
                  setResourceTreeFilters((prev) => ({
                    ...prev,
                    onlyUnreviewedFiles: true,
                  })),
                onDelete: () =>
                  setResourceTreeFilters((prev) => ({
                    ...prev,
                    onlyUnreviewedFiles: false,
                  })),
              },
              {
                id: 'license',
                selected: false,
                focusContent: () => licenseInputRef.current?.focus(),
                label: (
                  <LicenseAutocomplete
                    inputRef={licenseInputRef}
                    licenses={filterProps?.licenses ?? []}
                    selectedLicense={resourceTreeSelectedLicense}
                    setSelectedLicense={(license) =>
                      setResourceTreeFilters((prev) => ({
                        ...prev,
                        selectedLicense: license || '',
                      }))
                    }
                  />
                ),
              },
            ]}
            isActive={isResourceTreeFilterActive}
            onClear={() =>
              setResourceTreeFilters((prev) => ({
                ...prev,
                onlyUnreviewedFiles: false,
                selectedLicense: '',
              }))
            }
            anchorPosition={'right'}
            badgeColor={'secondary'}
            triggerStyle={resourceBrowserFilterButtonStyle}
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
