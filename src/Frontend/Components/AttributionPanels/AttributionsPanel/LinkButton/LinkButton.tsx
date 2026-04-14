// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { setSelectedAttributionId } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getIsPackageInfoDirty,
  getSelectedResourceId,
} from '../../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { addAttributionToSelectedResource } from '../../../../util/attribution-actions';
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  activeRelation,
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoDirty);
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();

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
      onClick={async () => {
        let newestAttributionId: string | undefined = undefined;
        if (attributions) {
          for (const attributionId of selectedAttributionIds) {
            newestAttributionId = await addAttributionToSelectedResource(
              selectedResourceId,
              attributions[attributionId],
            );
          }
        }
        setMultiSelectedAttributionIds([]);
        if (newestAttributionId !== undefined) {
          dispatch(setSelectedAttributionId(newestAttributionId));
        }
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
