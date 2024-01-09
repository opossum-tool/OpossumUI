// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import { remove } from 'lodash';
import { useEffect, useState } from 'react';

import { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PackagePanelTitle } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import {
  setPackageSearchTerm,
  toggleAccordionSearchField,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getDisplayedPackage,
  getManualData,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionIdsOfSelectedResource,
  getIsAccordionSearchFieldDisplayed,
  getPackageSearchTerm,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { DisplayPackageInfos } from '../../types/types';
import { createPackageCardId } from '../../util/create-package-card-id';
import { getDisplayPackageInfoWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';
import {
  AuditViewSorting,
  useActiveSortingInAuditView,
} from '../../util/use-active-sorting';
import { AggregatedAttributionsPanel } from '../AggregatedAttributionsPanel/AggregatedAttributionsPanel';
import { AllAttributionsPanel } from '../AllAttributionsPanel/AllAttributionsPanel';
import { IconButton } from '../IconButton/IconButton';
import { SearchPackagesIcon, SortAttributionsIcon } from '../Icons/Icons';
import { Dropdown } from '../InputElements/Dropdown';
import { SearchTextField } from '../SearchTextField/SearchTextField';

const classes = {
  dropdown: {
    marginTop: '10px',
    marginBottom: '8px',
  },
  container: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
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
  icons: {
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
  disabledLargeClickableIcon: {
    width: '26px',
    height: '26px',
    padding: '2px',
    margin: '0 2px',
    color: OpossumColors.disabledButtonGrey,
  },
};

interface ResourceDetailsTabsProps {
  isGlobalTabEnabled: boolean;
  isAddToPackageEnabled: boolean;
}

export function ResourceDetailsTabs(props: ResourceDetailsTabsProps) {
  const manualData = useAppSelector(getManualData);
  const selectedPackage = useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdsOfSelectedResource =
    useAppSelector(getAttributionIdsOfSelectedResource) || [];
  const isAccordionSearchFieldDisplayed = useAppSelector(
    getIsAccordionSearchFieldDisplayed,
  );
  const searchTerm = useAppSelector(getPackageSearchTerm);

  const {
    activeSorting,
    setActiveSorting,
    options: sortingOptions,
    isDefaultSortingActive,
  } = useActiveSortingInAuditView();
  const [showSortingSelect, setShowSortingSelect] = useState(
    !isDefaultSortingActive,
  );

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

  return (
    <MuiBox aria-label={'resource signals'} sx={classes.container}>
      <MuiTabs
        value={selectedTab}
        onChange={(_: React.SyntheticEvent, newTab: Tabs): void => {
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
            !props.isGlobalTabEnabled ||
            assignableManualAttributionIds.length < 1
          }
          sx={classes.tab}
        />
      </MuiTabs>
      <MuiBox sx={classes.icons}>
        <IconButton
          tooltipTitle={text.resourceDetails.sortTooltip}
          tooltipPlacement={'right'}
          onClick={() => setShowSortingSelect(!showSortingSelect)}
          disabled={!isDefaultSortingActive}
          icon={
            <SortAttributionsIcon
              sx={
                isDefaultSortingActive
                  ? classes.largeClickableIcon
                  : classes.disabledLargeClickableIcon
              }
            />
          }
        />
        <IconButton
          tooltipTitle={text.resourceDetails.searchTooltip}
          tooltipPlacement={'right'}
          onClick={() => {
            dispatch(toggleAccordionSearchField());
            dispatch(setPackageSearchTerm(''));
          }}
          icon={<SearchPackagesIcon sx={classes.largeClickableIcon} />}
        />
      </MuiBox>
      {showSortingSelect ? (
        <Dropdown
          sx={classes.dropdown}
          isEditable
          title={text.buttons.sort}
          value={activeSorting}
          menuItems={sortingOptions}
          handleChange={(event) =>
            setActiveSorting(event.target.value as AuditViewSorting)
          }
        />
      ) : null}
      {isAccordionSearchFieldDisplayed ? (
        <SearchTextField
          onInputChange={(input) => dispatch(setPackageSearchTerm(input))}
          search={searchTerm}
          autoFocus={true}
        />
      ) : null}
      <MuiBox sx={classes.container}>
        {selectedTab === Tabs.Local ? (
          <AggregatedAttributionsPanel
            isAddToPackageEnabled={isAddToPackageEnabled}
          />
        ) : (
          <AllAttributionsPanel
            displayPackageInfos={displayPackageInfos}
            selectedPackageCardId={selectedPackage?.packageCardId}
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
