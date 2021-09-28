// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography/Typography';
import React, { ReactElement } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { FilteredList } from '../FilteredList/FilteredList';
import { PackageCard } from '../PackageCard/PackageCard';
import { ListCardConfig } from '../../types/types';

const useStyles = makeStyles({
  title: {
    marginLeft: 5,
    display: 'flex',
    alignItems: 'center',
  },
});

interface AttributionListProps {
  attributions: Attributions;
  selectedAttributionId: string | null;
  attributionIdMarkedForReplacement: string | null;
  onCardClick(attributionId: string, isButton?: boolean): void;
  className?: string;
  maxHeight: number;
  title: string;
  topRightElement?: JSX.Element;
}

export function AttributionList(props: AttributionListProps): ReactElement {
  const classes = useStyles();
  const attributions = { ...props.attributions };
  const attributionIds: Array<string> = Object.keys({
    ...props.attributions,
  }).sort(getAlphabeticalComparer(attributions));

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
      />
    );
  }

  return (
    <div className={props.className}>
      <div className={classes.title}>
        <MuiTypography>{props.title}</MuiTypography>
        {props.topRightElement}
      </div>
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
