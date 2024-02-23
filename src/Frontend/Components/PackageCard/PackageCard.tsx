// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import { SxProps } from '@mui/system';
import { memo, useEffect, useMemo, useRef } from 'react';

import { Criticality, PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { getCardLabels } from '../../util/get-card-labels';
import { maybePluralize } from '../../util/maybe-pluralize';
import { Checkbox } from '../Checkbox/Checkbox';
import { getRightIcons } from './PackageCard.util';

export const PACKAGE_CARD_HEIGHT = 40;

const hoveredSelectedBackgroundColor = OpossumColors.middleBlue;
const hoveredBackgroundColor = OpossumColors.lightestBlueOnHover;

const classes = {
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: PACKAGE_CARD_HEIGHT,
    padding: '0 4px',
    gap: '4px',
    '&:focus': {
      background: hoveredBackgroundColor,
      outline: 'none',
    },
  },
  innerRoot: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: PACKAGE_CARD_HEIGHT,
    overflow: 'hidden',
    gap: '8px',
  },
  hover: {
    '&:hover': {
      cursor: 'pointer',
      background: hoveredBackgroundColor,
    },
  },
  selected: {
    background: OpossumColors.middleBlue,
    '&:hover': {
      background: hoveredSelectedBackgroundColor,
    },
    '&:focus': {
      background: hoveredSelectedBackgroundColor,
      outline: 'none',
    },
  },
  resolved: {
    opacity: 0.5,
    backgroundColor: 'white',
  },
  iconColumn: {
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gridAutoFlow: 'column',
    direction: 'rtl',
  },
  textLines: {
    flex: 1,
    overflow: 'hidden',
  },
  textLine: {
    userSelect: 'none',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
} satisfies SxProps;

export interface PackageCardConfig {
  criticality?: Criticality;
  excludeFromNotice?: boolean;
  firstParty?: boolean;
  followUp?: boolean;
  incomplete?: boolean;
  needsReview?: boolean;
  preSelected?: boolean;
  preferred?: boolean;
  resolved?: boolean;
  selected?: boolean;
  focused?: boolean;
  wasPreferred?: boolean;
}

export interface PackageCardProps {
  packageInfo: PackageInfo;
  cardConfig?: PackageCardConfig;
  onClick?(): void;
  checkbox?: {
    checked: boolean;
    disabled?: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

export const PackageCard = memo(
  ({ packageInfo, cardConfig, checkbox, onClick }: PackageCardProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const packageLabels = useMemo(
      () => getCardLabels(packageInfo),
      [packageInfo],
    );
    const effectiveCardConfig = useMemo<PackageCardConfig>(
      () => ({
        criticality: packageInfo.criticality,
        excludeFromNotice: packageInfo.excludeFromNotice,
        firstParty: packageInfo.firstParty,
        followUp: packageInfo.followUp,
        preSelected: packageInfo.preSelected,
        preferred: packageInfo.preferred,
        needsReview: packageInfo.needsReview,
        wasPreferred: packageInfo.wasPreferred,
        ...cardConfig,
      }),
      [cardConfig, packageInfo],
    );
    const rightIcons = useMemo(
      () => getRightIcons(effectiveCardConfig),
      [effectiveCardConfig],
    );

    useEffect(() => {
      if (effectiveCardConfig.focused) {
        ref.current?.focus();
      }
    }, [effectiveCardConfig.focused]);

    return (
      <MuiBox
        ref={ref}
        aria-label={`package card ${packageLabels[0]}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (['Enter', 'Space'].includes(event.code)) {
            event.preventDefault();
            onClick?.();
          }
        }}
        sx={{
          ...classes.root,
          ...(onClick && classes.hover),
          ...(cardConfig?.resolved && classes.resolved),
          ...(cardConfig?.selected && classes.selected),
        }}
      >
        {checkbox && (
          <Checkbox
            checked={checkbox.checked}
            disabled={checkbox.disabled}
            onChange={checkbox.onChange}
            disableRipple
          />
        )}
        <MuiBox sx={classes.innerRoot} onClick={onClick}>
          {packageInfo.count && (
            <MuiTooltip
              title={maybePluralize(
                packageInfo.count,
                text.attributionColumn.occurrence,
                {
                  showOne: true,
                },
              )}
              enterDelay={500}
            >
              <MuiChip
                sx={{ minWidth: '24px', userSelect: 'none' }}
                label={new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(packageInfo.count)}
                size={'small'}
              />
            </MuiTooltip>
          )}
          <MuiBox sx={classes.textLines}>
            <MuiTypography sx={classes.textLine}>
              {packageLabels[0]}
            </MuiTypography>
            {!!packageLabels[1] && (
              <MuiTypography sx={classes.textLine}>
                {packageLabels[1]}
              </MuiTypography>
            )}
          </MuiBox>
          <MuiBox sx={classes.iconColumn}>{rightIcons}</MuiBox>
        </MuiBox>
      </MuiBox>
    );
  },
);
