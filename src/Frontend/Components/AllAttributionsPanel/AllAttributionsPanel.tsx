// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography/Typography';
import React, { ReactElement } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { selectAttributionInAccordionPanelOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { addToSelectedResource } from '../../state/actions/resource-actions/save-actions';
import { FilteredList } from '../FilteredList/FilteredList';
import { PackagePanelCard } from '../PackagePanelCard/PackagePanelCard';
import { OpossumColors } from '../../shared-styles';
import { ListCardConfig } from '../../types/types';
import { useAppDispatch } from '../../state/hooks';

const useStyles = makeStyles({
  root: {
    padding: 10,
    backgroundColor: OpossumColors.white,
  },
});

interface AllAttributionsPanelProps {
  attributions: Attributions;
  selectedAttributionId: string | null;
  attributionIds: Array<string>;
  isAddToPackageEnabled: boolean;
}

export function AllAttributionsPanel(
  props: AllAttributionsPanelProps
): ReactElement {
  const classes = useStyles();
  const dispatch = useAppDispatch();

  function getPackagePanelCard(attributionId: string): ReactElement | null {
    const packageInfo = props.attributions && props.attributions[attributionId];

    function onCardClick(): void {
      dispatch(
        selectAttributionInAccordionPanelOrOpenUnsavedPopup(
          PackagePanelTitle.AllAttributions,
          attributionId
        )
      );
    }

    function onAddClick(): void {
      dispatch(addToSelectedResource(packageInfo));
    }

    const cardConfig: ListCardConfig = {
      isSelected: attributionId === props.selectedAttributionId,
      isPreSelected: Boolean(packageInfo.preSelected),
      firstParty: packageInfo.firstParty,
      excludeFromNotice: packageInfo.excludeFromNotice,
      followUp: Boolean(packageInfo.followUp),
    };

    return (
      <PackagePanelCard
        onClick={onCardClick}
        onIconClick={props.isAddToPackageEnabled ? onAddClick : undefined}
        cardConfig={cardConfig}
        key={`PackageCard-${packageInfo.packageName}-${attributionId}`}
        cardContent={{
          id: `all-attributions-${attributionId}`,
          name: packageInfo.packageName,
          packageVersion: packageInfo.packageVersion,
          copyright: packageInfo.copyright,
          licenseText: packageInfo.licenseText,
          comment: packageInfo.comment,
          url: packageInfo.url,
          licenseName: packageInfo.licenseName,
        }}
        hideResourceSpecificButtons={true}
        attributionId={attributionId}
      />
    );
  }

  return (
    <MuiPaper className={classes.root} elevation={0} square={true}>
      <MuiTypography>{PackagePanelTitle.AllAttributions}</MuiTypography>
      <FilteredList
        attributions={props.attributions}
        attributionIds={props.attributionIds}
        getAttributionCard={getPackagePanelCard}
        max={{ numberOfDisplayedItems: 20 }}
        cardVerticalDistance={41}
      />
    </MuiPaper>
  );
}
