// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import { getIsSelectedResourceBreakpoint } from '../../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const CreateButton: React.FC<PackagesPanelChildrenProps> = ({
  selectedAttributionId,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const isSelectedResourceBreakpoint = useAppSelector(
    getIsSelectedResourceBreakpoint,
  );

  return (
    <MuiIconButton
      aria-label={text.packageLists.create}
      disabled={
        isSelectedResourceBreakpoint ||
        !selectedAttributionId ||
        !!attributionIdsForReplacement.length
      }
      onClick={() =>
        dispatch(changeSelectedAttributionOrOpenUnsavedPopup(null))
      }
      size={'small'}
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
