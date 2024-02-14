// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import { SxProps } from '@mui/system';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { maybePluralize } from '../../util/maybe-pluralize';

export interface ListCardConfig {
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
  wasPreferred?: boolean;
}

export const LIST_CARD_HEIGHT = 40;

const hoveredSelectedBackgroundColor = OpossumColors.middleBlue;
const hoveredBackgroundColor = OpossumColors.lightestBlueOnHover;

const classes = {
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: LIST_CARD_HEIGHT,
    padding: '0 4px',
    gap: '4px',
  },
  innerRoot: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: LIST_CARD_HEIGHT,
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

interface ListCardProps {
  text: string;
  secondLineText?: string;
  count?: number;
  cardConfig?: ListCardConfig;
  onClick?(): void;
  rightIcons?: Array<React.ReactNode>;
  leftElement?: React.ReactNode;
}

export function ListCard(props: ListCardProps) {
  return (
    <MuiBox
      aria-label={`package card ${props.text}`}
      sx={{
        ...classes.root,
        ...(props.onClick && classes.hover),
        ...(props.cardConfig?.resolved && classes.resolved),
        ...(props.cardConfig?.selected && classes.selected),
      }}
    >
      {props.leftElement}
      <MuiBox sx={classes.innerRoot} onClick={props.onClick}>
        {props.count && (
          <MuiTooltip
            title={maybePluralize(
              props.count,
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
              }).format(props.count)}
              size={'small'}
            />
          </MuiTooltip>
        )}
        <MuiBox sx={classes.textLines}>
          <MuiTypography sx={classes.textLine}>{props.text}</MuiTypography>
          {props.secondLineText ? (
            <MuiTypography sx={classes.textLine}>
              {props.secondLineText}
            </MuiTypography>
          ) : null}
        </MuiBox>
        <MuiBox sx={classes.iconColumn}>{props.rightIcons}</MuiBox>
      </MuiBox>
    </MuiBox>
  );
}
