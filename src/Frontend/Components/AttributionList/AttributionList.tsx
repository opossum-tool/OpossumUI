// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { ReactElement } from 'react';

import { DisplayPackageInfos } from '../../types/types';
import { PackageCard } from '../PackageCard/PackageCard';
import { AttributionsViewPackageList } from '../PackageList/AttributionsViewPackageList';
import { ResizableBox } from '../ResizableBox/ResizableBox';

const classes = {
  topElements: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
};

interface AttributionListProps {
  displayPackageInfos: DisplayPackageInfos;
  sortedPackageCardIds: Array<string>;
  selectedPackageCardId: string | null;
  onCardClick(packageCardId: string, isButton?: boolean): void;
  sx?: SxProps;
  title: string | JSX.Element;
  topRightElement?: JSX.Element;
  filterElement?: JSX.Element;
}

export function AttributionList(props: AttributionListProps): ReactElement {
  function getAttributionCard(
    packageCardId: string,
    { isScrolling }: { isScrolling: boolean },
  ): ReactElement {
    const displayPackageInfo = props.displayPackageInfos[packageCardId];

    return (
      <PackageCard
        cardId={`attribution-list-${packageCardId}`}
        onClick={() => props.onCardClick(packageCardId)}
        cardConfig={{
          isSelected: packageCardId === props.selectedPackageCardId,
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
      sx={props.sx}
      defaultSize={{ width: '30%', height: 'auto' }}
    >
      <MuiBox sx={classes.topElements}>
        {props.title}
        {props.topRightElement}
      </MuiBox>
      {props.filterElement}
      <AttributionsViewPackageList
        displayPackageInfos={props.displayPackageInfos}
        sortedPackageCardIds={props.sortedPackageCardIds}
        getAttributionCard={getAttributionCard}
      />
    </ResizableBox>
  );
}
