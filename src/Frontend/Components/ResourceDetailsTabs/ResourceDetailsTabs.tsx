// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import { remove } from 'lodash';
import { ReactElement, useEffect, useState } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { setPackageSearchTerm } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getManualData } from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionIdsOfSelectedResource,
  getDisplayedPackage,
  getPackageSearchTerm,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { DisplayPackageInfos } from '../../types/types';
import { createPackageCardId } from '../../util/create-package-card-id';
import { getDisplayPackageInfoWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel/AggregatedAttributionsPanel';
import { AllAttributionsPanel } from '../AllAttributionsPanel/AllAttributionsPanel';
import { SearchTextField } from '../SearchTextField/SearchTextField';

const classes = {
  container: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  tabsRoot: {
    minHeight: 'fit-content',
    overflow: 'initial',
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
  searchBox: {
    marginTop: '10px',
  },
};

interface ResourceDetailsTabsProps {
  isGlobalTabEnabled: boolean;
  isAddToPackageEnabled: boolean;
}

export function ResourceDetailsTabs(
  props: ResourceDetailsTabsProps,
): ReactElement | null {
  const manualData = useAppSelector(getManualData);

  const selectedPackage = useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdsOfSelectedResource: Array<string> =
    useAppSelector(getAttributionIdsOfSelectedResource) || [];
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

  const { assignableManualAttributionIds, displayPackageInfos } =
    getAssignableManualAttributionIdsAndDisplayPackageInfos(
      manualData.attributions,
      attributionIdsOfSelectedResource,
    );

  const isAddToPackageEnabled: boolean =
    props.isGlobalTabEnabled && props.isAddToPackageEnabled;

  const tabLabels = {
    [Tabs.Local]: 'Local',
    [Tabs.Global]: 'Global',
  };

  function onSearchInputChange(input: string): void {
    dispatch(setPackageSearchTerm(input));
  }

  return (
    <MuiBox sx={classes.container}>
      <MuiTabs
        value={selectedTab}
        onChange={(_: React.SyntheticEvent, newTab: Tabs): void => {
          setSelectedTab(newTab);
        }}
        aria-label="Add To Tabs"
        sx={{ ...classes.tabsRoot, indicator: classes.indicator }}
        variant="fullWidth"
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
            !props.isGlobalTabEnabled ||
            assignableManualAttributionIds.length < 1
          }
          sx={classes.tab}
        />
      </MuiTabs>
      <SearchTextField
        onInputChange={onSearchInputChange}
        search={searchTerm}
        autoFocus={true}
        sx={classes.searchBox}
      />
      <MuiBox style={{ overflow: 'auto' }}>
        {selectedTab === Tabs.Local ? (
          <AggregatedAttributionsPanel
            isAddToPackageEnabled={isAddToPackageEnabled}
          />
        ) : (
          <AllAttributionsPanel
            displayPackageInfos={displayPackageInfos}
            selectedPackageCardId={
              selectedPackage && selectedPackage.packageCardId
            }
            isAddToPackageEnabled={
              props.isGlobalTabEnabled && props.isAddToPackageEnabled
            }
          />
        )}
      </MuiBox>
    </MuiBox>
  );
}

function getAssignableManualAttributionIdsAndDisplayPackageInfos(
  manualAttributions: Attributions,
  attributionIdsOfSelectedResource: Array<string>,
): {
  assignableManualAttributionIds: Array<string>;
  displayPackageInfos: DisplayPackageInfos;
} {
  const assignableManualAttributionIds: Array<string> = remove(
    Object.keys(manualAttributions),
    (attributionId: string): boolean =>
      !attributionIdsOfSelectedResource.includes(attributionId),
  );

  const displayPackageInfos: DisplayPackageInfos = {};
  assignableManualAttributionIds.forEach((attributionId, index) => {
    const packageCardId = createPackageCardId(
      PackagePanelTitle.AllAttributions,
      index,
    );
    displayPackageInfos[packageCardId] =
      getDisplayPackageInfoWithCountFromAttributions([
        [attributionId, manualAttributions[attributionId], undefined],
      ]).displayPackageInfo;
  });

  return { assignableManualAttributionIds, displayPackageInfos };
}
