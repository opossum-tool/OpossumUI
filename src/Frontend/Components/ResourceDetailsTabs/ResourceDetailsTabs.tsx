// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import MuiTabs from '@material-ui/core/Tabs';
import MuiTab from '@material-ui/core/Tab';
import {
  getExternalData,
  getManualData,
} from '../../state/selectors/all-views-resource-selectors';
import { PanelPackage } from '../../types/types';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel/AggregatedAttributionsPanel';
import { AllAttributionsPanel } from '../AllAttributionsPanel/AllAttributionsPanel';
import { remove, isEqual } from 'lodash';
import { getPanelData, PanelData } from './resource-details-tabs-helpers';
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
    backgroundColor: OpossumColors.white,
    padding: '4px 8px',
    minHeight: 'fit-content',
    '&:hover': {
      backgroundColor: OpossumColors.whiteOnHover,
    },
  },
  indicator: {
    backgroundColor: OpossumColors.darkBlue,
  },
});

interface ResourceDetailsTabsProps {
  isAllAttributionsTabEnabled: boolean;
  isAddToPackageEnabled: boolean;
}

export function ResourceDetailsTabs(
  props: ResourceDetailsTabsProps
): ReactElement | null {
  const classes = useStyles();

  const manualData = useAppSelector(getManualData);
  const externalData = useAppSelector(getExternalData);

  const selectedPackage: PanelPackage | null =
    useAppSelector(getDisplayedPackage);
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

  const panelData: Array<PanelData> = useMemo(
    () => getPanelData(selectedResourceId, manualData, externalData),
    // manualData is excluded from dependencies on purpose to avoid recalculation when
    // it changes. Usually this is not an issue as the displayed data remains correct.
    // In consequence, the panelData is eventually consistent.

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedResourceId, externalData]
  );

  const assignableAttributionIds: Array<string> = remove(
    Object.keys(manualData.attributions),
    (attributionId: string): boolean =>
      !attributionIdsOfSelectedResource.includes(attributionId)
  );

  return (
    <React.Fragment>
      <MuiTabs
        value={selectedTab}
        onChange={(
          event: React.ChangeEvent<Record<string, unknown>>,
          newTab: Tabs
        ): void => {
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
        <AggregatedAttributionsPanel
          panelData={panelData}
          isAddToPackageEnabled={
            props.isAllAttributionsTabEnabled && props.isAddToPackageEnabled
          }
        />
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
