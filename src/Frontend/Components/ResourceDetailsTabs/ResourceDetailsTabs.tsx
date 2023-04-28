// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { getManualData } from '../../state/selectors/all-views-resource-selectors';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel/AggregatedAttributionsPanel';
import { AllAttributionsPanel } from '../AllAttributionsPanel/AllAttributionsPanel';
import { pick, remove } from 'lodash';
import {
  getAttributionIdsOfSelectedResource,
  getDisplayedPackage,
  getIsAccordionSearchFieldDisplayed,
  getPackageSearchTerm,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { OpossumColors } from '../../shared-styles';
import { useAppDispatch, useAppSelector } from '../../state/hooks';

import { IconButton } from '../IconButton/IconButton';
import { SearchPackagesIcon } from '../Icons/Icons';
import {
  setPackageSearchTerm,
  toggleAccordionSearchField,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import { SearchTextField } from '../SearchTextField/SearchTextField';

const classes = {
  tabsRoot: {
    minHeight: 'fit-content',
  },
  tab: {
    backgroundColor: OpossumColors.almostWhiteBlue,
    color: OpossumColors.black,
    padding: '8px',
    minHeight: 'fit-content',
    '&:hover': {
      backgroundColor: OpossumColors.whiteOnHover,
    },
    '&.Mui-selected': {
      backgroundColor: OpossumColors.white,
      color: OpossumColors.black,
    },
  },
  searchToggle: {
    position: 'absolute',
    right: '0px',
    top: '0px',
  },
  indicator: {
    backgroundColor: OpossumColors.darkBlue,
  },
  largeClickableIcon: {
    width: '26px',
    height: '26px',
    padding: '2px',
    margin: '0 2px',
    color: OpossumColors.darkBlue,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
  searchBox: {
    marginTop: '10px',
  },
};

interface ResourceDetailsTabsProps {
  isGlobalTabEnabled: boolean;
  isAddToPackageEnabled: boolean;
}

export function ResourceDetailsTabs(
  props: ResourceDetailsTabsProps
): ReactElement | null {
  const manualData = useAppSelector(getManualData);

  const selectedPackage = useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdsOfSelectedResource: Array<string> =
    useAppSelector(getAttributionIdsOfSelectedResource) || [];
  const isAccordionSearchFieldDisplayed = useAppSelector(
    getIsAccordionSearchFieldDisplayed
  );
  const searchTerm = useAppSelector(getPackageSearchTerm);

  const dispatch = useAppDispatch();

  enum Tabs {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    Local = 0,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    Global = 1,
  }
  const [selectedTab, setSelectedTab] = useState<Tabs>(Tabs.Local);
  useEffect(() => {
    setSelectedTab(Tabs.Local);
  }, [selectedResourceId, Tabs.Local]);

  const assignableAttributionIds: Array<string> = remove(
    Object.keys(manualData.attributions),
    (attributionId: string): boolean =>
      !attributionIdsOfSelectedResource.includes(attributionId)
  );

  const manualAttributionsToDisplay = pick(
    manualData.attributions,
    assignableAttributionIds
  );

  const isAddToPackageEnabled: boolean =
    props.isGlobalTabEnabled && props.isAddToPackageEnabled;
  const aggregatedAttributionsPanel = useMemo(
    () => (
      <AggregatedAttributionsPanel
        isAddToPackageEnabled={isAddToPackageEnabled}
      />
    ),
    [isAddToPackageEnabled]
  );

  const tabLabels = {
    [Tabs.Local]: 'Local',
    [Tabs.Global]: 'Global',
  };

  function onSearchToggleClick(): void {
    dispatch(toggleAccordionSearchField());
    dispatch(setPackageSearchTerm(''));
  }

  function onSearchInputChange(input: string): void {
    dispatch(setPackageSearchTerm(input));
  }

  return (
    <div style={{ position: 'relative' }}>
      <MuiTabs
        value={selectedTab}
        onChange={(event: React.SyntheticEvent, newTab: Tabs): void => {
          setSelectedTab(newTab);
        }}
        aria-label="Add To Tabs"
        sx={{ ...classes.tabsRoot, indicator: classes.indicator }}
      >
        <MuiTab
          label={tabLabels[Tabs.Local]}
          aria-label={'Local Tab'}
          id={`tab-${Tabs.Local}`}
          sx={classes.tab}
        />
        <MuiTab
          label={tabLabels[Tabs.Global]}
          aria-label={'Global Tab'}
          id={`tab-${Tabs.Global}`}
          disabled={
            !props.isGlobalTabEnabled || assignableAttributionIds.length < 1
          }
          sx={classes.tab}
        />
      </MuiTabs>
      <IconButton
        tooltipTitle="Search signals by name, license name, copyright text and version"
        tooltipPlacement="right"
        onClick={onSearchToggleClick}
        icon={<SearchPackagesIcon sx={classes.largeClickableIcon} />}
        sx={classes.searchToggle}
      />
      {isAccordionSearchFieldDisplayed ? (
        <SearchTextField
          onInputChange={onSearchInputChange}
          search={searchTerm}
          autoFocus={true}
          showIcon={false}
          sx={classes.searchBox}
        />
      ) : null}
      {selectedTab === Tabs.Local ? (
        aggregatedAttributionsPanel
      ) : (
        <AllAttributionsPanel
          attributions={manualAttributionsToDisplay}
          selectedAttributionId={
            selectedPackage && selectedPackage.attributionId
          }
          isAddToPackageEnabled={
            props.isGlobalTabEnabled && props.isAddToPackageEnabled
          }
        />
      )}
    </div>
  );
}
