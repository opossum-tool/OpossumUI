// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import React, { ReactElement } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { selectAttributionInAccordionPanelOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { OpossumColors } from '../../shared-styles';
import { PackageCardConfig } from '../../types/types';
import { useAppDispatch } from '../../state/hooks';
import { PackageList } from '../PackageList/PackageList';
import { PackageCard } from '../PackageCard/PackageCard';
import {
  convertDisplayPackageInfoToPackageInfo,
  convertPackageInfoToDisplayPackageInfo,
} from '../../util/convert-package-info';
import { getDisplayAttributionWithCountFromAttributions } from '../../util/get-display-attributions-with-count-from-attributions';

const classes = {
  root: {
    padding: '10px',
    backgroundColor: OpossumColors.white,
  },
};

interface AllAttributionsPanelProps {
  attributions: Attributions;
  selectedAttributionId: string | null;
  isAddToPackageEnabled: boolean;
}

export function AllAttributionsPanel(
  props: AllAttributionsPanelProps
): ReactElement {
  const dispatch = useAppDispatch();

  const displayAttributionsWithCounts = Object.entries(props.attributions).map(
    ([attributionId, packageInfo]) =>
      getDisplayAttributionWithCountFromAttributions([
        [attributionId, packageInfo, undefined],
      ])
  );

  function getPackageCard(attributionId: string): ReactElement | null {
    const displayPackageInfo = convertPackageInfoToDisplayPackageInfo(
      props.attributions[attributionId],
      [attributionId]
    );

    function onCardClick(): void {
      dispatch(
        selectAttributionInAccordionPanelOrOpenUnsavedPopup(
          PackagePanelTitle.AllAttributions,
          attributionId
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
        displayAttributionsWithCount={displayAttributionsWithCounts}
        getAttributionCard={getPackageCard}
        maxNumberOfDisplayedItems={20}
        listTitle={PackagePanelTitle.AllAttributions}
      />
    </MuiPaper>
  );
}
