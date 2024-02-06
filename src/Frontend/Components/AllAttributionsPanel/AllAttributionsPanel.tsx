// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiPaper from '@mui/material/Paper';
import { ReactElement, useMemo } from 'react';

import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { selectPackageCardInAuditViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch } from '../../state/hooks';
import { useSignalSorting } from '../../state/variables/use-active-sorting';
import { PackageCardConfig } from '../../types/types';
import { sortAttributions } from '../../util/sort-attributions';
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
  displayPackageInfos: Attributions;
  selectedPackageCardId?: string;
  isAddToPackageEnabled: boolean;
}

export function AllAttributionsPanel(
  props: AllAttributionsPanelProps,
): ReactElement {
  const dispatch = useAppDispatch();
  const { signalSorting } = useSignalSorting();

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
      dispatch(addToSelectedResource(displayPackageInfo));
    }

    const cardConfig: PackageCardConfig = {
      isSelected: packageCardId === props.selectedPackageCardId,
      isPreSelected: Boolean(displayPackageInfo.preSelected),
    };

    return (
      <PackageCard
        onClick={onCardClick}
        onIconClick={props.isAddToPackageEnabled ? onAddClick : undefined}
        cardConfig={cardConfig}
        key={`PackageCard-${displayPackageInfo.packageName}-${packageCardId}`}
        packageInfo={displayPackageInfo}
        showOpenResourcesIcon={true}
      />
    );
  }

  const sortedAttributions = useMemo(
    () =>
      Object.values(
        sortAttributions({
          attributions: props.displayPackageInfos,
          sorting: signalSorting,
        }),
      ),
    [props.displayPackageInfos, signalSorting],
  );

  return (
    <MuiPaper sx={classes.root} elevation={0} square={true}>
      <PackageList
        displayPackageInfos={sortedAttributions}
        getAttributionCard={getPackageCard}
        listTitle={PackagePanelTitle.AllAttributions}
        fullHeight
      />
    </MuiPaper>
  );
}
