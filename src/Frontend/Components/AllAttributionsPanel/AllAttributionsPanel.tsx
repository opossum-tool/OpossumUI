// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import { ReactElement } from 'react';
import { PackagePanelTitle } from '../../enums/enums';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { OpossumColors } from '../../shared-styles';
import { DisplayPackageInfos, PackageCardConfig } from '../../types/types';
import { useAppDispatch } from '../../state/hooks';
import { PackageList } from '../PackageList/PackageList';
import { PackageCard } from '../PackageCard/PackageCard';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';

const classes = {
  root: {
    padding: '10px',
    backgroundColor: OpossumColors.white,
  },
};

interface AllAttributionsPanelProps {
  displayPackageInfos: DisplayPackageInfos;
  selectedPackageCardId: string | null;
  isAddToPackageEnabled: boolean;
}

export function AllAttributionsPanel(
  props: AllAttributionsPanelProps,
): ReactElement {
  const dispatch = useAppDispatch();

  function getPackageCard(packageCardId: string): ReactElement | null {
    const displayPackageInfo = props.displayPackageInfos[packageCardId];

    function onCardClick(): void {
      dispatch(
        selectPackageCardInAuditViewOrOpenUnsavedPopup(
          PackagePanelTitle.AllAttributions,
          packageCardId,
          displayPackageInfo,
        ),
      );
    }

    function onAddClick(): void {
      const packageInfo =
        convertDisplayPackageInfoToPackageInfo(displayPackageInfo);
      dispatch(addToSelectedResource(packageInfo));
    }

    const cardConfig: PackageCardConfig = {
      isSelected: packageCardId === props.selectedPackageCardId,
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        cardId={`all-attributions-${packageCardId}`}
        onClick={onCardClick}
        onIconClick={props.isAddToPackageEnabled ? onAddClick : undefined}
        cardConfig={cardConfig}
        key={`PackageCard-${displayPackageInfo.packageName}-${packageCardId}`}
        displayPackageInfo={displayPackageInfo}
        hideResourceSpecificButtons={true}
        showOpenResourcesIcon={true}
      />
    );
  }

  return (
    <MuiPaper sx={classes.root} elevation={0} square={true}>
      <PackageList
        displayPackageInfos={props.displayPackageInfos}
        sortedPackageCardIds={Object.keys(props.displayPackageInfos)}
        getAttributionCard={getPackageCard}
        maxNumberOfDisplayedItems={20}
        listTitle={PackagePanelTitle.AllAttributions}
      />
    </MuiPaper>
  );
}
