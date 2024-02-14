// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useMemo } from 'react';

import { text } from '../../../../../shared/text';
import { removeResolvedExternalAttributionAndSave } from '../../../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import { getResolvedExternalAttributions } from '../../../../state/selectors/resource-selectors';
import { useAreHiddenSignalsVisible } from '../../../../state/variables/use-are-hidden-signals-visible';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const RestoreButton: React.FC<PackagesPanelChildrenProps> = ({
  selectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions,
  );
  const [areHiddenSignalsVisible] = useAreHiddenSignalsVisible();
  const someSelectedAttributionsAreHidden = useMemo(
    () =>
      !!selectedAttributionIds.length &&
      selectedAttributionIds.some((id) =>
        resolvedExternalAttributionIds.has(id),
      ),
    [resolvedExternalAttributionIds, selectedAttributionIds],
  );

  if (!areHiddenSignalsVisible) {
    return null;
  }

  return (
    <MuiIconButton
      aria-label={text.packageLists.restore}
      disabled={!someSelectedAttributionsAreHidden}
      size={'small'}
      onClick={() => {
        dispatch(
          removeResolvedExternalAttributionAndSave(selectedAttributionIds),
        );
      }}
    >
      <MuiTooltip
        title={text.packageLists.restore}
        disableInteractive
        placement={'top'}
      >
        <RestoreFromTrashIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
