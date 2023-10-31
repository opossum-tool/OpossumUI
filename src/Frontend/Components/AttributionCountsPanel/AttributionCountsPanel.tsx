// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiTypography from '@mui/material/Typography';
import pickBy from 'lodash/pickBy';
import { ReactElement } from 'react';

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getManualAttributions } from '../../state/selectors/all-views-resource-selectors';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import {
  FollowUpIcon,
  IncompleteAttributionsIcon,
  MissingPackageNameIcon,
  NeedsReviewIcon,
  PreSelectedIcon,
} from '../Icons/Icons';

const classes = {
  icons: {
    marginBottom: '-3.5px',
    marginLeft: '-3px',
    marginRight: '-2.5px',
    width: '13px',
    height: '13px',
  },
  titleNeedsReviewIcon: {
    color: OpossumColors.orange,
  },
  titleFollowUpIcon: {
    color: OpossumColors.red,
  },
  preselectedAttributionIcon: {
    color: OpossumColors.darkBlue,
  },
  incompleteAttributionIcon: {
    color: OpossumColors.lightOrange,
  },
  missingPackageNameIcon: {
    color: OpossumColors.darkOrange,
  },
};

interface AttributionCountsPanelProps {
  sx?: SxProps;
}

export function AttributionCountsPanel(
  props: AttributionCountsPanelProps,
): ReactElement {
  const attributions: Attributions = useAppSelector(getManualAttributions);
  const numberOfAttributions = Object.keys(attributions).length;
  const numberOfAttributionsThatNeedReview = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.needsReview),
  ).length;
  const numberOfFollowUps = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.followUp),
  ).length;
  const numberOfPreselectedAttributions = Object.keys(
    pickBy(attributions, (value: PackageInfo) => value.preSelected),
  ).length;

  const numberOfIncompleteAttributions = Object.keys(
    pickBy(attributions, (value: PackageInfo) =>
      isPackageInfoIncomplete(value),
    ),
  ).length;

  const numberOfAttributionsWithoutPackageName = Object.keys(
    pickBy(attributions, (value: PackageInfo) => !value.packageName),
  ).length;

  return (
    <MuiTypography
      variant={'subtitle2'}
      sx={getSxFromPropsAndClasses({
        sxProps: props.sx,
      })}
    >
      {`Attributions (${numberOfAttributions} total, ${numberOfAttributionsThatNeedReview}`}
      <NeedsReviewIcon
        sx={{
          ...classes.titleNeedsReviewIcon,
          ...classes.icons,
        }}
      />
      {`, ${numberOfFollowUps}`}
      <FollowUpIcon
        sx={{
          ...classes.titleFollowUpIcon,
          ...classes.icons,
        }}
      />
      {`, ${numberOfPreselectedAttributions}`}
      <PreSelectedIcon
        sx={{
          ...classes.preselectedAttributionIcon,
          ...classes.icons,
        }}
      />
      {`, ${numberOfIncompleteAttributions}`}
      <IncompleteAttributionsIcon
        sx={{
          ...classes.incompleteAttributionIcon,
          ...classes.icons,
        }}
      />
      {`, ${numberOfAttributionsWithoutPackageName}`}
      <MissingPackageNameIcon
        sx={{ ...classes.icons, ...classes.missingPackageNameIcon }}
      />
      {')'}
    </MuiTypography>
  );
}
