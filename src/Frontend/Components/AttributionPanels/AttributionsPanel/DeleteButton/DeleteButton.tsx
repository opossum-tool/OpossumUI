// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import DeleteIcon from '@mui/icons-material/Delete';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useState } from 'react';

import { text } from '../../../../../shared/text';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { ConfirmDeletionPopup } from '../../../ConfirmDeletionPopup/ConfirmDeletionPopup';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const DeleteButton: React.FC<PackagesPanelChildrenProps> = ({
  selectedAttributionIds,
}) => {
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const [isConfirmDeletionPopupOpen, setIsConfirmDeletionPopupOpen] =
    useState(false);

  return (
    <>
      <MuiIconButton
        aria-label={text.packageLists.delete}
        disabled={
          !selectedAttributionIds.length ||
          !!attributionIdsForReplacement.length
        }
        onClick={() => setIsConfirmDeletionPopupOpen(true)}
        size={'small'}
      >
        <MuiTooltip
          title={text.packageLists.delete}
          disableInteractive
          placement={'top'}
        >
          <DeleteIcon />
        </MuiTooltip>
      </MuiIconButton>
      <ConfirmDeletionPopup
        open={isConfirmDeletionPopupOpen}
        onClose={() => setIsConfirmDeletionPopupOpen(false)}
        attributionIdsToDelete={selectedAttributionIds}
      />
    </>
  );
};
