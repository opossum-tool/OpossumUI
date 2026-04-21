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
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../../../state/selectors/resource-selectors';
import { backend } from '../../../../util/backendClient';
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();

  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={isSelectedResourceBreakpoint || !selectedAttributionIds.length}
      size={'small'}
      onClick={() => {
        attributions &&
          selectedAttributionIds.forEach(async (attributionId) => {
            const result = await backend.createOrMatchAttribution.mutate({
              resourcePath: selectedResourceId,
              packageInfo: attributions[attributionId],
            });
            if (attributionId === selectedAttributionId) {
              dispatch(setSelectedAttributionId(result.attribution));
            }
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
