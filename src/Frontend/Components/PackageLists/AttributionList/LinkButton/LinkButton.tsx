// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { addToSelectedResource } from '../../../../state/actions/resource-actions/save-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackageListChildrenProps } from '../../PackageList/PackageList';

export const LinkButton: React.FC<PackageListChildrenProps> = ({
  attributions,
  selectedAttributionId,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  return (
    <MuiIconButton
      aria-label={'link to resource'}
      disabled={
        !selectedAttributionIds.filter(
          (id) => attributions[id].relation !== 'resource',
        ).length || !!attributionIdsForReplacement.length
      }
      onClick={() => {
        selectedAttributionIds
          .filter((id) => attributions[id].relation !== 'resource')
          .forEach((attributionId) => {
            dispatch(
              addToSelectedResource(
                attributions[attributionId],
                selectedAttributionId,
              ),
            );
          });
        setMultiSelectedAttributionIds([]);
      }}
    >
      <MuiTooltip
        title={text.packageLists.useAsAttribution}
        disableInteractive
        placement={'top'}
      >
        <CallMergeIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
