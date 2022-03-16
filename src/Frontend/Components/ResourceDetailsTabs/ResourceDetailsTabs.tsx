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
  isGlobalTabEnabled: boolean;
  isAddToPackageEnabled: boolean;
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
    Local = 0,
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
          label={tabLabels[Tabs.Local]}
          aria-label={'Local Tab'}
          id={`tab-${Tabs.Local}`}
          className={classes.tab}
        />
        <MuiTab
          label={tabLabels[Tabs.Global]}
          aria-label={'Global Tab'}
          id={`tab-${Tabs.Global}`}
          disabled={
            !props.isGlobalTabEnabled || assignableAttributionIds.length < 1
          }
          className={classes.tab}
        />
      </MuiTabs>
      {selectedTab === Tabs.Local ? (
        aggregatedAttributionsPanel
      ) : (
        <AllAttributionsPanel
          attributions={manualData.attributions}
          selectedAttributionId={
            selectedPackage && selectedPackage.attributionId
          }
          attributionIds={assignableAttributionIds}
          isAddToPackageEnabled={
            props.isGlobalTabEnabled && props.isAddToPackageEnabled
          }
        />
      )}
    </React.Fragment>
  );
}
