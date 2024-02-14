// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useState } from 'react';

import { text } from '../../../../../shared/text';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { ConfirmSavePopup } from '../../../ConfirmSavePopup/ConfirmSavePopup';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const ConfirmButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  selectedAttributionIds,
}) => {
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const preSelectedAttributionIds = selectedAttributionIds.filter(
    (id) => attributions?.[id]?.preSelected,
  );

  return (
    <>
      <MuiIconButton
        aria-label={text.packageLists.confirm}
        disabled={
          !preSelectedAttributionIds.length ||
          !!attributionIdsForReplacement.length
        }
        onClick={() => setIsConfirmSavePopupOpen(true)}
        size={'small'}
      >
        <MuiTooltip
          title={text.packageLists.confirm}
          disableInteractive
          placement={'top'}
        >
          <CheckIcon />
        </MuiTooltip>
      </MuiIconButton>
      <ConfirmSavePopup
        attributionIdsToSave={preSelectedAttributionIds}
        open={isConfirmSavePopupOpen}
        onClose={() => setIsConfirmSavePopupOpen(false)}
      />
    </>
  );
};
