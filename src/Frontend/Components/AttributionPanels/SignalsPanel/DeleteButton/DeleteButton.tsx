// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import DeleteIcon from '@mui/icons-material/Delete';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useMemo } from 'react';

import { text } from '../../../../../shared/text';
import { backend } from '../../../../util/backendClient';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const DeleteButton: React.FC<PackagesPanelChildrenProps> = ({
  selectedAttributionIds,
}) => {
  const { data: resolvedExternalAttributionIds } =
    backend.resolvedAttributionUuids.useQuery();
  const someSelectedAttributionsAreVisible = useMemo(
    () =>
      !!selectedAttributionIds.length &&
      selectedAttributionIds.some(
        (id) => !resolvedExternalAttributionIds?.has(id),
      ),
    [resolvedExternalAttributionIds, selectedAttributionIds],
  );

  return (
    <MuiIconButton
      aria-label={text.packageLists.delete}
      disabled={!someSelectedAttributionsAreVisible}
      size={'small'}
      onClick={async () => {
        await backend.resolveAttributions.mutate({
          attributionUuids: selectedAttributionIds,
        });
        window.electronAPI.saveFile();
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
