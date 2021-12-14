// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiTypography from '@mui/material/Typography';
import React, { ReactElement } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { FilteredList } from '../FilteredList/FilteredList';
import { PackageCard } from '../PackageCard/PackageCard';
import { ListCardConfig } from '../../types/types';
import { Checkbox } from '../Checkbox/Checkbox';
import { useAttributionColumnStyles } from '../AttributionColumn/shared-attribution-column-styles';
import { getMultiSelectMode } from '../../state/selectors/attribution-view-resource-selectors';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { setMultiSelectMode } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { CheckboxLabel } from '../../enums/enums';

const useStyles = makeStyles({
  topElements: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  title: {
    marginLeft: 5,
  },
});

interface AttributionListProps {
  attributions: Attributions;
  selectedAttributionId: string | null;
  attributionIdMarkedForReplacement: string;
  onCardClick(attributionId: string, isButton?: boolean): void;
  className?: string;
  maxHeight: number;
  title: string;
  topRightElement?: JSX.Element;
  filterElement?: JSX.Element;
}

export function AttributionList(props: AttributionListProps): ReactElement {
  const classes = { ...useAttributionColumnStyles(), ...useStyles() };
  const attributions = { ...props.attributions };
  const attributionIds: Array<string> = Object.keys({
    ...props.attributions,
  }).sort(getAlphabeticalComparer(attributions));
  const multiSelectMode = useAppSelector(getMultiSelectMode);
  const dispatch = useAppDispatch();

  function getAttributionCard(attributionId: string): ReactElement {
    const attribution = attributions[attributionId];

    function isSelected(): boolean {
      return attributionId === props.selectedAttributionId;
    }

    function isMarkedForReplacement(): boolean {
      return attributionId === props.attributionIdMarkedForReplacement;
    }

    function onClick(): void {
      props.onCardClick(attributionId);
    }

    const cardConfig: ListCardConfig = {
      isSelected: isSelected(),
      isMarkedForReplacement: isMarkedForReplacement(),
      isPreSelected: Boolean(attribution.preSelected),
      firstParty: attribution.firstParty,
      excludeFromNotice: attribution.excludeFromNotice,
      followUp: Boolean(attribution.followUp),
    };

    return (
      <PackageCard
        attributionId={attributionId}
        onClick={onClick}
        cardConfig={cardConfig}
        key={`AttributionCard-${attribution.packageName}-${attributionId}`}
        cardContent={{
          id: `attribution-list-${attributionId}`,
          name: attribution.packageName,
          packageVersion: attribution.packageVersion,
          copyright: attribution.copyright,
          licenseText: attribution.licenseText,
          comment: attribution.comment,
          url: attribution.url,
          licenseName: attribution.licenseName,
        }}
        hideResourceSpecificButtons={true}
      />
    );
  }

  function handleMultiSelectModeChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    dispatch(setMultiSelectMode(event.target.checked));
  }

  return (
    <div className={props.className}>
      <div className={classes.topElements}>
        <MuiTypography className={classes.title}>{props.title}</MuiTypography>
        <Checkbox
          label={CheckboxLabel.MultiSelectMode}
          checked={multiSelectMode}
          onChange={handleMultiSelectModeChange}
          className={classes.checkBox}
        />
        {props.topRightElement}
      </div>
      {props.filterElement}
      <FilteredList
        attributions={props.attributions}
        attributionIds={attributionIds}
        getAttributionCard={getAttributionCard}
        max={{ height: props.maxHeight }}
        cardVerticalDistance={41}
      />
    </div>
  );
}
