// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import MuiBox from '@mui/material/Box';
import { ChangeEvent, useState } from 'react';

import { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { clickableIcon, disabledIcon } from '../../shared-styles';
import { changeSelectedAttributionIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparerForAttributions } from '../../util/get-alphabetical-comparer';
import {
  AttributionViewSorting,
  useActiveSortingInAttributionView,
} from '../../util/use-active-sorting';
import { AttributionCountsPanel } from '../AttributionCountsPanel/AttributionCountsPanel';
import { FilterMultiSelect } from '../Filter/FilterMultiSelect';
import { useFilteredAttributions } from '../Filter/FilterMultiSelect.util';
import { IconButton } from '../IconButton/IconButton';
import { Dropdown, MenuItem } from '../InputElements/Dropdown';
import { PackageCard } from '../PackageCard/PackageCard';
import { AttributionsViewPackageList } from '../PackageList/AttributionsViewPackageList';
import { ResizableBox } from '../ResizableBox/ResizableBox';

const classes = {
  dropdown: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  topElements: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  root: {
    margin: '5px',
    display: 'flex',
    flexDirection: 'column',
  },
};

const SORTING_ALGORITHMS: Array<MenuItem> = [
  {
    value: text.attributionViewSorting.alphabetical,
    name: text.attributionViewSorting.alphabetical,
  },
  {
    value: text.attributionViewSorting.byCriticality,
    name: text.attributionViewSorting.byCriticality,
  },
];
const defaultSorting = text.attributionViewSorting.alphabetical;

export function AttributionList() {
  const dispatch = useAppDispatch();
  const selectedPackageCardIdInAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView,
  );

  const { attributions, activeFilters } = useFilteredAttributions();
  const hasActiveFilters = !!activeFilters.length;
  const [showMultiSelect, setShowMultiselect] = useState(hasActiveFilters);

  const [activeSorting, setActiveSorting] = useActiveSortingInAttributionView();
  const [showSortingSelect, setShowSortingSelect] = useState<boolean>(false);
  const defaultSortingIsActive = activeSorting === defaultSorting;

  if (!defaultSortingIsActive && !showSortingSelect) {
    setShowSortingSelect(!showSortingSelect);
  }

  const { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos } =
    getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
      attributions,
      activeSorting === text.attributionViewSorting.byCriticality,
    );

  function onSortInputChange(event: ChangeEvent<HTMLInputElement>): void {
    setActiveSorting(event.target.value as AttributionViewSorting);
  }

  function getAttributionCard(
    packageCardId: string,
    { isScrolling }: { isScrolling: boolean },
  ) {
    const displayPackageInfo = filteredDisplayPackageInfos[packageCardId];

    return (
      <PackageCard
        cardId={`attribution-list-${packageCardId}`}
        onClick={() =>
          dispatch(changeSelectedAttributionIdOrOpenUnsavedPopup(packageCardId))
        }
        cardConfig={{
          isSelected: packageCardId === selectedPackageCardIdInAttributionView,
          isPreSelected: displayPackageInfo.preSelected,
        }}
        key={`AttributionCard-${displayPackageInfo.packageName}-${packageCardId}`}
        displayPackageInfo={displayPackageInfo}
        hideResourceSpecificButtons={true}
        showCheckBox={true}
        isScrolling={isScrolling}
      />
    );
  }

  return (
    <ResizableBox
      aria-label={'attribution list'}
      sx={classes.root}
      defaultSize={{ width: '30%', height: 'auto' }}
    >
      <MuiBox sx={classes.topElements}>
        <AttributionCountsPanel />
        <MuiBox>
          <IconButton
            tooltipTitle="Sort"
            tooltipPlacement="right"
            onClick={(): void => setShowSortingSelect(!showSortingSelect)}
            disabled={!defaultSortingIsActive}
            icon={
              <SortIcon
                aria-label={'Sort icon'}
                sx={!defaultSortingIsActive ? disabledIcon : clickableIcon}
              />
            }
          />
          <IconButton
            tooltipTitle={'Filters'}
            tooltipPlacement={'right'}
            onClick={() => setShowMultiselect((prev) => !prev)}
            disabled={hasActiveFilters}
            icon={
              <FilterAltIcon
                sx={hasActiveFilters ? disabledIcon : clickableIcon}
              />
            }
          />
        </MuiBox>
      </MuiBox>
      {showSortingSelect ? (
        <Dropdown
          sx={classes.dropdown}
          isEditable={true}
          title={'Sorting Algorithm'}
          value={activeSorting}
          menuItems={SORTING_ALGORITHMS}
          handleChange={onSortInputChange}
        />
      ) : null}
      {showMultiSelect ? (
        <FilterMultiSelect sx={{ marginTop: '8px' }} />
      ) : undefined}
      <AttributionsViewPackageList
        displayPackageInfos={filteredDisplayPackageInfos}
        sortedPackageCardIds={filteredAndSortedPackageCardIds}
        getAttributionCard={getAttributionCard}
      />
    </ResizableBox>
  );
}

function getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
  attributions: Attributions,
  sortByCriticality: boolean,
): {
  filteredAndSortedPackageCardIds: Array<string>;
  filteredDisplayPackageInfos: DisplayPackageInfos;
} {
  const sortedAttributionIds = Object.keys(attributions).sort(
    getAlphabeticalComparerForAttributions(attributions, sortByCriticality),
  );

  const filteredAndSortedPackageCardIds: Array<string> = [];
  const filteredDisplayPackageInfos: DisplayPackageInfos = {};

  sortedAttributionIds.forEach((attributionId) => {
    filteredAndSortedPackageCardIds.push(attributionId);
    filteredDisplayPackageInfos[attributionId] =
      convertPackageInfoToDisplayPackageInfo(attributions[attributionId], [
        attributionId,
      ]);
  });
  return { filteredAndSortedPackageCardIds, filteredDisplayPackageInfos };
}
