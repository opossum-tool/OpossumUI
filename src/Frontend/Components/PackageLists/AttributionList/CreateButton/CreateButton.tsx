// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackageListChildrenProps } from '../../PackageList/PackageList';

export const CreateButton: React.FC<PackageListChildrenProps> = ({
  selectedAttributionId,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();

  return (
    <MuiIconButton
      aria-label={'create button'}
      disabled={!selectedAttributionId || !!attributionIdsForReplacement.length}
      onClick={() =>
        dispatch(changeSelectedAttributionOrOpenUnsavedPopup(null))
      }
    >
      <MuiTooltip
        title={text.packageLists.create}
        disableInteractive
        placement={'top'}
      >
        <AddIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
