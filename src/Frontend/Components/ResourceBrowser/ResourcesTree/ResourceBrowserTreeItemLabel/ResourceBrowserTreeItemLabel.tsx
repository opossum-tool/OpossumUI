// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { Criticality } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { treeItemClasses } from '../../../../shared-styles';
import {
  BreakpointIcon,
  CriticalityIcon,
  DirectoryIcon,
  FileIcon,
  SignalIcon,
} from '../../../Icons/Icons';

interface ResourceBrowserTreeItemLabelProps {
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
  criticality?: Criticality;
}

export function ResourceBrowserTreeItemLabel(
  props: ResourceBrowserTreeItemLabelProps,
): ReactElement {
  let iconSx: SxProps | undefined;
  let labelDetail: string | undefined;
  if (props.hasManualAttribution) {
    iconSx = treeItemClasses.hasAttribution;
    labelDetail = 'with attribution';
  } else if (props.hasParentWithManualAttribution) {
    iconSx = treeItemClasses.hasParentWithManualAttribution;
    labelDetail = 'with parent attribution';
  } else if (props.hasUnresolvedExternalAttribution) {
    iconSx = treeItemClasses.hasSignal;
    labelDetail = 'with signal';
  } else if (
    props.containsExternalAttribution &&
    !props.containsResourcesWithOnlyExternalAttribution
  ) {
    iconSx = treeItemClasses.notContainsResourcesWithOnlyExternalAttribution;
    labelDetail =
      'with all children containing signal also containing attributions';
  } else if (
    props.containsExternalAttribution &&
    props.containsManualAttribution
  ) {
    iconSx = treeItemClasses.containsManualAndExternalAttribution;
  } else if (
    props.containsExternalAttribution &&
    !props.containsManualAttribution
  ) {
    iconSx = treeItemClasses.hasSignal;
    labelDetail = 'containing signals';
  } else if (
    !props.containsExternalAttribution &&
    props.containsManualAttribution
  ) {
    iconSx = treeItemClasses.containsManualAttribution;
    labelDetail = 'containing attributions';
  } else {
    iconSx = treeItemClasses.resourceWithoutInformation;
    labelDetail = 'without information';
  }

  return (
    <MuiBox sx={treeItemClasses.labelRoot}>
      {props.showFolderIcon ? (
        props.isAttributionBreakpoint ? (
          <BreakpointIcon />
        ) : (
          <DirectoryIcon sx={iconSx} labelDetail={labelDetail} />
        )
      ) : (
        <FileIcon sx={iconSx} labelDetail={labelDetail} />
      )}
      <MuiTypography
        sx={{
          ...treeItemClasses.text,
          ...(props.isAttributionBreakpoint ? treeItemClasses.breakpoint : {}),
        }}
      >
        {props.labelText}
      </MuiTypography>
      {props.hasExternalAttribution &&
        (props.criticality ? (
          <CriticalityIcon
            criticality={props.criticality}
            tooltip={
              props.criticality === Criticality.High
                ? text.resourceBrowser.hasHighlyCriticalSignals
                : text.resourceBrowser.hasMediumCriticalSignals
            }
            tooltipPlacement={'right'}
          />
        ) : (
          <SignalIcon />
        ))}
    </MuiBox>
  );
}
