// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiPaper from '@mui/material/Paper';
import { ReactElement } from 'react';

import { AuditViewSortingType, PackagePanelTitle } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch } from '../../state/hooks';
import { DisplayPackageInfos, PackageCardConfig } from '../../types/types';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparerForAttributions } from '../../util/get-alphabetical-comparer';
import { useVariable } from '../../util/use-variable';
import { PackageCard } from '../PackageCard/PackageCard';
import { PackageList } from '../PackageList/PackageList';

const classes = {
  root: {
    padding: '10px',
    backgroundColor: OpossumColors.white,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
};

interface AllAttributionsPanelProps {
  displayPackageInfos: DisplayPackageInfos;
  selectedPackageCardId?: string;
  isAddToPackageEnabled: boolean;
}

export function AllAttributionsPanel(
  props: AllAttributionsPanelProps,
): ReactElement {
  const dispatch = useAppDispatch();
  const [activeSorting] = useVariable(
    'active-sorting-audit-view',
    AuditViewSortingType.ByOccurrence,
  );

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

  const sortedPackageCardIds = Object.keys(props.displayPackageInfos).sort(
    getAlphabeticalComparerForAttributions(
      props.displayPackageInfos,
      activeSorting === AuditViewSortingType.ByCriticality,
    ),
  );

  return (
    <MuiPaper sx={classes.root} elevation={0} square={true}>
      <PackageList
        displayPackageInfos={props.displayPackageInfos}
        sortedPackageCardIds={sortedPackageCardIds}
        getAttributionCard={getPackageCard}
        listTitle={PackagePanelTitle.AllAttributions}
        fullHeight
      />
    </MuiPaper>
  );
}
