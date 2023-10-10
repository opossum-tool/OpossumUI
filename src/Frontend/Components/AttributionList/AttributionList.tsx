// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { PackageCard } from '../PackageCard/PackageCard';
import { DisplayPackageInfos, PackageCardConfig } from '../../types/types';
import { checkboxClass } from '../../shared-styles';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';
import { AttributionsViewPackageList } from '../PackageList/AttributionsViewPackageList';

const classes = {
  ...checkboxClass,
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
  maxHeight: number;
  title: string | JSX.Element;
  topRightElement?: JSX.Element;
  filterElement?: JSX.Element;
}

export function AttributionList(props: AttributionListProps): ReactElement {
  function getAttributionCard(packageCardId: string): ReactElement {
    const displayPackageInfo = props.displayPackageInfos[packageCardId];

    function isSelected(): boolean {
      return packageCardId === props.selectedPackageCardId;
    }

    function onClick(): void {
      props.onCardClick(packageCardId);
    }

    const cardConfig: PackageCardConfig = {
      isSelected: isSelected(),
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        cardId={`attribution-list-${packageCardId}`}
        onClick={onClick}
        cardConfig={cardConfig}
        key={`AttributionCard-${displayPackageInfo.packageName}-${packageCardId}`}
        displayPackageInfo={displayPackageInfo}
        hideResourceSpecificButtons={true}
        showCheckBox={true}
      />
    );
  }

  return (
    <MuiBox sx={props.sx}>
      <MuiBox sx={classes.topElements}>
        {props.title}
        {props.topRightElement}
      </MuiBox>
      {props.filterElement}
      <AttributionsViewPackageList
        displayPackageInfos={props.displayPackageInfos}
        sortedPackageCardIds={props.sortedPackageCardIds}
        getAttributionCard={getAttributionCard}
        max={{ height: props.maxHeight }}
      />
    </MuiBox>
  );
}
