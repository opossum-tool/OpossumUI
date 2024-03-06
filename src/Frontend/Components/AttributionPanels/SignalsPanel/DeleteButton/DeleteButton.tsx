// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import DeleteIcon from '@mui/icons-material/Delete';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useMemo } from 'react';

import { text } from '../../../../../shared/text';
import { addResolvedExternalAttributionAndSave } from '../../../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import { getResolvedExternalAttributions } from '../../../../state/selectors/resource-selectors';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const DeleteButton: React.FC<PackagesPanelChildrenProps> = ({
  selectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions,
  );
  const someSelectedAttributionsAreVisible = useMemo(
    () =>
      !!selectedAttributionIds.length &&
      selectedAttributionIds.some(
        (id) => !resolvedExternalAttributionIds.has(id),
      ),
    [resolvedExternalAttributionIds, selectedAttributionIds],
  );

  return (
    <MuiIconButton
      aria-label={text.packageLists.delete}
      disabled={!someSelectedAttributionsAreVisible}
      size={'small'}
      onClick={() => {
        dispatch(addResolvedExternalAttributionAndSave(selectedAttributionIds));
      }}
    >
      <MuiTooltip
        title={text.packageLists.delete}
        disableInteractive
        placement={'top'}
      >
        <DeleteIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
