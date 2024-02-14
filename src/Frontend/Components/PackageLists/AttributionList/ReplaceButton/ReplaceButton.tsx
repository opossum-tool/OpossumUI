// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackageListChildrenProps } from '../../PackageList/PackageList';

export const ReplaceButton: React.FC<PackageListChildrenProps> = ({
  attributionIds,
  multiSelectedAttributionIds,
  selectedAttributionIds,
}) => {
  const [attributionIdsForReplacement, setAttributionIdsForReplacement] =
    useAttributionIdsForReplacement();

  return (
    <MuiIconButton
      aria-label={'replace button'}
      disabled={
        !selectedAttributionIds.length ||
        !(attributionIds.length - multiSelectedAttributionIds.length) ||
        attributionIds.length < 2
      }
      onClick={() => {
        setAttributionIdsForReplacement((prev) =>
          prev.length ? [] : selectedAttributionIds,
        );
      }}
      color={attributionIdsForReplacement.length ? 'success' : undefined}
    >
      <MuiTooltip
        title={
          attributionIdsForReplacement.length
            ? text.packageLists.cancelReplace
            : text.packageLists.replace
        }
        disableInteractive
        placement={'top'}
      >
        <ChangeCircleIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
