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
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackageListChildrenProps } from '../../PackageList/PackageList';

export const RestoreButton: React.FC<PackageListChildrenProps> = ({
  selectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const resolvedExternalAttributionIds = useAppSelector(
    getResolvedExternalAttributions,
  );
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
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
    <MuiTooltip
      title={text.packageLists.restore}
      disableInteractive
      placement={'top'}
    >
      <span>
        <MuiIconButton
          aria-label={'restore button'}
          disabled={
            !someSelectedAttributionsAreHidden ||
            !!attributionIdsForReplacement.length
          }
          onClick={() => {
            dispatch(
              removeResolvedExternalAttributionAndSave(selectedAttributionIds),
            );
          }}
        >
          <RestoreFromTrashIcon />
        </MuiIconButton>
      </span>
    </MuiTooltip>
  );
};
