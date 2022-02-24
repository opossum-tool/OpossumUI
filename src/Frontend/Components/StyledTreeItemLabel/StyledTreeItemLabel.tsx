// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiTypography from '@mui/material/Typography';
import React, { ReactElement } from 'react';
import {
  BreakpointIcon,
  DirectoryIcon,
  FileIcon,
  SignalIcon,
} from '../Icons/Icons';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import clsx from 'clsx';

const useStyles = makeStyles({
  manualIcon: {
    color: OpossumColors.darkBlue,
    height: 20,
    width: 20,
  },
  externalIcon: {
    color: OpossumColors.black,
    height: 20,
    width: 20,
  },
  labelRoot: {
    display: 'flex',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  arrowPlaceholder: {
    height: 20,
    width: 20,
  },
  text: {
    paddingRight: 5,
  },
  breakpoint: {
    fontWeight: 'bold',
    color: OpossumColors.grey,
  },
  hasSignal: {
    color: OpossumColors.orange,
  },
  hasAttribution: {
    color: OpossumColors.green,
  },
  hasParentWithManualAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  containsExternalAttribution: {
    color: OpossumColors.pastelRed,
  },
  containsManualAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  containsManualAndExternalAttribution: {
    color: OpossumColors.middleBlue,
  },
  resourceWithoutInformation: {
    color: OpossumColors.disabledGrey,
  },
  notContainsResourcesWithOnlyExternalAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  tooltip: tooltipStyle,
});

interface StyledTreeItemProps {
  labelText: string;
  hasManualAttribution: boolean;
  hasExternalAttribution: boolean;
  hasUnresolvedExternalAttribution: boolean;
  hasParentWithManualAttribution: boolean;
  containsExternalAttribution: boolean;
  containsManualAttribution: boolean;
  canHaveChildren: boolean;
  isAttributionBreakpoint: boolean;
  showFolderIcon: boolean;
  containsResourcesWithOnlyExternalAttribution: boolean;
}

export function StyledTreeItemLabel(props: StyledTreeItemProps): ReactElement {
  const classes = useStyles();

  let iconClassName: string | undefined;
  let labelDetail: string | undefined;
  if (props.hasManualAttribution) {
    iconClassName = classes.hasAttribution;
    labelDetail = 'with attribution';
  } else if (props.hasParentWithManualAttribution) {
    iconClassName = classes.hasParentWithManualAttribution;
    labelDetail = 'with parent attribution';
  } else if (props.hasUnresolvedExternalAttribution) {
    iconClassName = classes.hasSignal;
    labelDetail = 'with signal';
  } else if (
    props.containsExternalAttribution &&
    !props.containsResourcesWithOnlyExternalAttribution
  ) {
    iconClassName = classes.notContainsResourcesWithOnlyExternalAttribution;
    labelDetail =
      'with all children containing signal also containing attributions';
  } else if (
    props.containsExternalAttribution &&
    props.containsManualAttribution
  ) {
    iconClassName = classes.containsManualAndExternalAttribution;
  } else if (
    props.containsExternalAttribution &&
    !props.containsManualAttribution
  ) {
    iconClassName = classes.containsExternalAttribution;
    labelDetail = 'containing signals';
  } else if (
    !props.containsExternalAttribution &&
    props.containsManualAttribution
  ) {
    iconClassName = classes.containsManualAttribution;
    labelDetail = 'containing attributions';
  } else {
    iconClassName = classes.resourceWithoutInformation;
    labelDetail = 'without information';
  }

  return (
    <div className={classes.labelRoot}>
      {props.showFolderIcon ? (
        props.isAttributionBreakpoint ? (
          <BreakpointIcon />
        ) : (
          <DirectoryIcon className={iconClassName} labelDetail={labelDetail} />
        )
      ) : (
        <FileIcon className={iconClassName} labelDetail={labelDetail} />
      )}
      <MuiTypography
        className={clsx(
          classes.text,
          props.isAttributionBreakpoint && classes.breakpoint
        )}
      >
        {props.labelText}
      </MuiTypography>
      {props.hasExternalAttribution ? <SignalIcon /> : null}
    </div>
  );
}
