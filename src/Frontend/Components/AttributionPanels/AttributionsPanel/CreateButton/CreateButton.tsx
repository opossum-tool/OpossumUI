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
import { useIsSelectedResourceBreakpoint } from '../../../../util/use-selected-resource';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const CreateButton: React.FC<PackagesPanelChildrenProps> = ({
  pickerMode,
  selectedAttributionId,
}) => {
  const dispatch = useAppDispatch();
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();

  return (
    <MuiIconButton
      aria-label={text.packageLists.create}
      disabled={
        isSelectedResourceBreakpoint ||
        !selectedAttributionId ||
        pickerMode.isActive
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
