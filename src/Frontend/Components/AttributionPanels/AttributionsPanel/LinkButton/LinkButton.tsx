// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { addToSelectedResource } from '../../../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getIsPackageInfoModified,
  getIsSelectedResourceBreakpoint,
} from '../../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  activeRelation,
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoModified);
  const isSelectedResourceBreakpoint = useAppSelector(
    getIsSelectedResourceBreakpoint,
  );

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={
        isSelectedResourceBreakpoint ||
        !selectedAttributionIds.length ||
        isPackageInfoModified ||
        activeRelation === 'resource' ||
        !!attributionIdsForReplacement.length
      }
      size={'small'}
      onClick={() => {
        attributions &&
          selectedAttributionIds.forEach((attributionId) => {
            dispatch(addToSelectedResource(attributions[attributionId]));
          });
        setMultiSelectedAttributionIds([]);
      }}
    >
      <MuiTooltip
        title={text.packageLists.linkAsAttribution}
        disableInteractive
        placement={'top'}
      >
        <CallMergeIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
