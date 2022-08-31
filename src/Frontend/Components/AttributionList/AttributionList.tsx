// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { Attributions } from '../../../shared/shared-types';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { PackageCard } from '../PackageCard/PackageCard';
import { ListCardConfig } from '../../types/types';
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
  attributions: Attributions;
  selectedAttributionId: string | null;
  attributionIdMarkedForReplacement: string;
  onCardClick(attributionId: string, isButton?: boolean): void;
  sx?: SxProps;
  maxHeight: number;
  title: string | JSX.Element;
  topRightElement?: JSX.Element;
  filterElement?: JSX.Element;
}

export function AttributionList(props: AttributionListProps): ReactElement {
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
      criticality: attribution.preSelected
        ? attribution.criticality
        : undefined,
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
        attributions={props.attributions}
        attributionIds={attributionIds}
        getAttributionCard={getAttributionCard}
        max={{ height: props.maxHeight }}
      />
    </MuiBox>
  );
}
