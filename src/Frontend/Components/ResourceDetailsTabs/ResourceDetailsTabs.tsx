// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import MuiTabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import { getManualData } from '../../state/selectors/all-views-resource-selectors';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel/AggregatedAttributionsPanel';
import { AllAttributionsPanel } from '../AllAttributionsPanel/AllAttributionsPanel';
import { isEqual, remove } from 'lodash';
import {
  getAttributionIdsOfSelectedResource,
  getDisplayedPackage,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { ResourceDetailsTabsWorkers } from '../../web-workers/get-new-accordion-worker';

const useStyles = makeStyles({
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
  indicator: {
    backgroundColor: OpossumColors.darkBlue,
  },
});

interface ResourceDetailsTabsProps {
  isAllAttributionsTabEnabled: boolean;
  isAddToPackageEnabled: boolean;
  resourceDetailsTabsWorkers: ResourceDetailsTabsWorkers;
}

export function ResourceDetailsTabs(
  props: ResourceDetailsTabsProps
): ReactElement | null {
  const classes = useStyles();

  const manualData = useAppSelector(getManualData);

  const selectedPackage = useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdsOfSelectedResource: Array<string> = useAppSelector(
    getAttributionIdsOfSelectedResource,
    isEqual
  );

  enum Tabs {
    SignalsAndContent = 0,
    AllAttributions = 1,
  }
  const [selectedTab, setSelectedTab] = useState<Tabs>(Tabs.SignalsAndContent);
  useEffect(() => {
    setSelectedTab(Tabs.SignalsAndContent);
  }, [selectedResourceId, Tabs.SignalsAndContent]);

  const assignableAttributionIds: Array<string> = remove(
    Object.keys(manualData.attributions),
    (attributionId: string): boolean =>
      !attributionIdsOfSelectedResource.includes(attributionId)
  );

  const isAddToPackageEnabled: boolean =
    props.isAllAttributionsTabEnabled && props.isAddToPackageEnabled;
  const aggregatedAttributionsPanel = useMemo(
    () => (
      <AggregatedAttributionsPanel
        resourceDetailsTabsWorkers={props.resourceDetailsTabsWorkers}
        isAddToPackageEnabled={isAddToPackageEnabled}
      />
    ),
    [isAddToPackageEnabled, props.resourceDetailsTabsWorkers]
  );

  return (
    <React.Fragment>
      <MuiTabs
        value={selectedTab}
        onChange={(event: React.SyntheticEvent, newTab: Tabs): void => {
          setSelectedTab(newTab);
        }}
        aria-label="Add To Tabs"
        className={classes.tabsRoot}
        classes={{ indicator: classes.indicator }}
      >
        <MuiTab
          label={'Signals & Content'}
          aria-label={'Signals & Content Tab'}
          id={`tab-${Tabs.SignalsAndContent}`}
          className={classes.tab}
        />
        <MuiTab
          label={'All Attributions'}
          aria-label={'All Attributions Tab'}
          id={`tab-${Tabs.AllAttributions}`}
          disabled={
            !props.isAllAttributionsTabEnabled ||
            assignableAttributionIds.length < 1
          }
          className={classes.tab}
        />
      </MuiTabs>
      {selectedTab === Tabs.SignalsAndContent ? (
        aggregatedAttributionsPanel
      ) : (
        <AllAttributionsPanel
          attributions={manualData.attributions}
          selectedAttributionId={
            selectedPackage && selectedPackage.attributionId
          }
          attributionIds={assignableAttributionIds}
          isAddToPackageEnabled={
            props.isAllAttributionsTabEnabled && props.isAddToPackageEnabled
          }
        />
      )}
    </React.Fragment>
  );
}
