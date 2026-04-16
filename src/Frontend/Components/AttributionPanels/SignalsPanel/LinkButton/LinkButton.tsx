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
import { getSelectedResourceId } from '../../../../state/selectors/resource-selectors';
import { addAttributionsToSelectedResource } from '../../../../util/attribution-actions';
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const resourceId = useAppSelector(getSelectedResourceId);

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={isSelectedResourceBreakpoint || !selectedAttributionIds.length}
      size={'small'}
      onClick={async () => {
        if (attributions) {
          const selected = Object.fromEntries(
            selectedAttributionIds
              .filter((id) => id in attributions)
              .map((id) => [id, attributions[id]]),
          );
          const newId = await addAttributionsToSelectedResource(
            resourceId,
            selected,
          );
          dispatch(setSelectedAttributionId(newId));
        }
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
