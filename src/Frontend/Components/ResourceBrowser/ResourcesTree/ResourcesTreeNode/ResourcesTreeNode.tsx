// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { Criticality } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { treeItemClasses } from '../../../../shared-styles';
import { useAppSelector } from '../../../../state/hooks';
import { getClassifications } from '../../../../state/selectors/resource-selectors';
import { useUserSettings } from '../../../../state/variables/use-user-setting';
import {
  BreakpointIcon,
  ClassificationIcon,
  CriticalityIcon,
  DirectoryIcon,
  FileIcon,
  SignalIcon,
} from '../../../Icons/Icons';
import { TreeNode } from '../../../VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode';

export function ResourcesTreeNode({ resource }: TreeNode) {
  const classification_mapping = useAppSelector(getClassifications);
  const [userSettings] = useUserSettings();
  const showClassifications = userSettings.showClassifications;
  const showCriticality = userSettings.showCriticality;

  let iconSx: SxProps | undefined;
  let labelDetail: string | undefined;
  if (resource.hasManualAttribution) {
    iconSx = treeItemClasses.hasAttribution;
    labelDetail = 'with attribution';
  } else if (resource.hasParentWithManualAttribution) {
    iconSx = treeItemClasses.hasParentWithManualAttribution;
    labelDetail = 'with parent attribution';
  } else if (resource.hasUnresolvedExternalAttribution) {
    iconSx = treeItemClasses.hasSignal;
    labelDetail = 'with signal';
  } else if (
    resource.containsExternalAttribution &&
    !resource.containsResourcesWithOnlyExternalAttribution
  ) {
    iconSx = treeItemClasses.notContainsResourcesWithOnlyExternalAttribution;
    labelDetail =
      'with all children containing signal also containing attributions';
  } else if (
    resource.containsExternalAttribution &&
    resource.containsManualAttribution
  ) {
    iconSx = treeItemClasses.containsManualAndExternalAttribution;
  } else if (
    resource.containsExternalAttribution &&
    !resource.containsManualAttribution
  ) {
    iconSx = treeItemClasses.hasSignal;
    labelDetail = 'containing signals';
  } else if (
    !resource.containsExternalAttribution &&
    resource.containsManualAttribution
  ) {
    iconSx = treeItemClasses.containsManualAttribution;
    labelDetail = 'containing attributions';
  } else {
    iconSx = treeItemClasses.resourceWithoutInformation;
    labelDetail = 'without information';
  }

  return (
    <MuiBox sx={treeItemClasses.labelRoot}>
      {resource.isFile ? (
        <FileIcon sx={iconSx} labelDetail={labelDetail} />
      ) : resource.isAttributionBreakpoint ? (
        <BreakpointIcon />
      ) : (
        <DirectoryIcon sx={iconSx} labelDetail={labelDetail} />
      )}
      <MuiTypography
        sx={{
          ...treeItemClasses.text,
          ...(resource.isAttributionBreakpoint
            ? treeItemClasses.breakpoint
            : {}),
        }}
      >
        {resource.labelText}
      </MuiTypography>
      {resource.hasUnresolvedExternalAttribution &&
        (resource.criticality && showCriticality ? (
          <CriticalityIcon
            criticality={resource.criticality}
            tooltip={
              resource.criticality === Criticality.High
                ? text.resourceBrowser.hasHighlyCriticalSignals
                : text.resourceBrowser.hasMediumCriticalSignals
            }
            tooltipPlacement={'right'}
          />
        ) : (
          <SignalIcon />
        ))}
      {showClassifications && resource.hasUnresolvedExternalAttribution && (
        <ClassificationIcon
          classification={resource.classification ?? undefined}
          classificationsConfig={classification_mapping}
          tooltipPlacement={'right'}
        />
      )}
    </MuiBox>
  );
}
