// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import React, { ReactElement } from 'react';
import { PackagePanelTitle } from '../../enums/enums';
import { selectAttributionInAccordionPanelOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { OpossumColors } from '../../shared-styles';
import {
  DisplayAttributionWithCount,
  PackageCardConfig,
} from '../../types/types';
import { useAppDispatch } from '../../state/hooks';
import { PackageList } from '../PackageList/PackageList';
import { PackageCard } from '../PackageCard/PackageCard';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';
import { getAttributionFromDisplayAttributionsWithCount } from '../../util/get-attribution-from-display-attributions-with-count';

const classes = {
  root: {
    padding: '10px',
    backgroundColor: OpossumColors.white,
  },
};

interface AllAttributionsPanelProps {
  displayAttributions: Array<DisplayAttributionWithCount>;
  selectedAttributionId: string | null;
  isAddToPackageEnabled: boolean;
}

export function AllAttributionsPanel(
  props: AllAttributionsPanelProps
): ReactElement {
  const dispatch = useAppDispatch();

  function getPackageCard(attributionId: string): ReactElement | null {
    const displayPackageInfo = getAttributionFromDisplayAttributionsWithCount(
      attributionId,
      props.displayAttributions
    );

    function onCardClick(): void {
      dispatch(
        selectAttributionInAccordionPanelOrOpenUnsavedPopup(
          PackagePanelTitle.AllAttributions,
          attributionId,
          displayPackageInfo
        )
      );
    }

    function onAddClick(): void {
      const packageInfo =
        convertDisplayPackageInfoToPackageInfo(displayPackageInfo);
      dispatch(addToSelectedResource(packageInfo));
    }

    const cardConfig: PackageCardConfig = {
      isSelected: attributionId === props.selectedAttributionId,
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        cardId={`all-attributions-${attributionId}`}
        onClick={onCardClick}
        onIconClick={props.isAddToPackageEnabled ? onAddClick : undefined}
        cardConfig={cardConfig}
        key={`PackageCard-${displayPackageInfo.packageName}-${attributionId}`}
        displayPackageInfo={displayPackageInfo}
        hideResourceSpecificButtons={true}
        showOpenResourcesIcon={true}
      />
    );
  }

  return (
    <MuiPaper sx={classes.root} elevation={0} square={true}>
      <PackageList
        displayAttributionsWithCount={props.displayAttributions}
        getAttributionCard={getPackageCard}
        maxNumberOfDisplayedItems={20}
        listTitle={PackagePanelTitle.AllAttributions}
      />
    </MuiPaper>
  );
}
