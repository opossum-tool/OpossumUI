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
import { addAttributionToSelectedResource } from '../../../../util/attribution-actions';
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
        let newestAttributionId: string | undefined;
        if (attributions) {
          for (const attributionId of selectedAttributionIds) {
            newestAttributionId = await addAttributionToSelectedResource(
              resourceId,
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
