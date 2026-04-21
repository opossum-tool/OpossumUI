// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { useAppSelector } from '../../../../state/hooks';
import { getSelectedResourceId } from '../../../../state/selectors/resource-selectors';
import { backend } from '../../../../util/backendClient';
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={isSelectedResourceBreakpoint || !selectedAttributionIds.length}
      size={'small'}
      onClick={() => {
        attributions &&
          selectedAttributionIds.forEach(async (attributionId) => {
            await backend.createOrMatchAttribution.mutate({
              resourceId: selectedResourceId,
              packageInfo: attributions[attributionId],
            });
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
