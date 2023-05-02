// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { DisplayPackageInfo } from '../../../shared/shared-types';
import { PackageCard } from '../PackageCard/PackageCard';
import {
  DisplayAttributionWithCount,
  PackageCardConfig,
} from '../../types/types';
import { checkboxClass } from '../../shared-styles';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';
import { AttributionsViewPackageList } from '../PackageList/AttributionsViewPackageList';
import { getAttributionFromDisplayAttributionsWithCount } from '../../util/get-attribution-from-display-attributions-with-count';

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
  displayAttributions: Array<DisplayAttributionWithCount>;
  selectedAttributionId: string | null;
  onCardClick(attributionId: string, isButton?: boolean): void;
  sx?: SxProps;
  maxHeight: number;
  title: string | JSX.Element;
  topRightElement?: JSX.Element;
  filterElement?: JSX.Element;
}

export function AttributionList(props: AttributionListProps): ReactElement {
  function getAttributionCard(attributionId: string): ReactElement {
    const displayPackageInfo: DisplayPackageInfo =
      getAttributionFromDisplayAttributionsWithCount(
        attributionId,
        props.displayAttributions
      );

    function isSelected(): boolean {
      return attributionId === props.selectedAttributionId;
    }

    function onClick(): void {
      props.onCardClick(attributionId);
    }

    const cardConfig: PackageCardConfig = {
      isSelected: isSelected(),
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        cardId={`attribution-list-${attributionId}`}
        onClick={onClick}
        cardConfig={cardConfig}
        key={`AttributionCard-${displayPackageInfo.packageName}-${attributionId}`}
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
        displayAttributions={props.displayAttributions}
        getAttributionCard={getAttributionCard}
        max={{ height: props.maxHeight }}
      />
    </MuiBox>
  );
}
