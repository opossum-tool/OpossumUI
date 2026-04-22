// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useEffect } from 'react';

import { text } from '../../../../../shared/text';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { useSelectedAttributionIsExternal } from '../../../../util/use-selected-attribution';
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const ReplaceButton: React.FC<PackagesPanelChildrenProps> = ({
  attributionIds,
  multiSelectedAttributionIds,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
}) => {
  const [attributionIdsForReplacement, setAttributionIdsForReplacement] =
    useAttributionIdsForReplacement();
  const label = attributionIdsForReplacement.length
    ? text.packageLists.cancelReplace
    : text.packageLists.replace;

  const mutationsPending = useIsMutating() > 0;

  const selectedAttributionIsExternal = useSelectedAttributionIsExternal();

  useEffect(() => {
    if (attributionIdsForReplacement.length && selectedAttributionIsExternal) {
      setAttributionIdsForReplacement([]);
    }
  }, [
    attributionIdsForReplacement.length,
    selectedAttributionIsExternal,
    setAttributionIdsForReplacement,
  ]);

  return (
    <MuiIconButton
      aria-label={label}
      disabled={
        !attributionIds ||
        !selectedAttributionIds.length ||
        !(attributionIds.length - multiSelectedAttributionIds.length) ||
        attributionIds.length < 2 ||
        mutationsPending
      }
      size={'small'}
      onClick={() => {
        setAttributionIdsForReplacement((prev) =>
          prev.length ? [] : selectedAttributionIds,
        );
        attributionIdsForReplacement.length &&
          setMultiSelectedAttributionIds([]);
      }}
      color={attributionIdsForReplacement.length ? 'success' : undefined}
    >
      <MuiTooltip title={label} disableInteractive placement={'top'}>
        <ChangeCircleIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
