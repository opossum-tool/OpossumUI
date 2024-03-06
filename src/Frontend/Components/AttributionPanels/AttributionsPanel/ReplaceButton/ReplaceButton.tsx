// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useEffect } from 'react';

import { text } from '../../../../../shared/text';
import { useAppSelector } from '../../../../state/hooks';
import { getManualAttributions } from '../../../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const ReplaceButton: React.FC<PackagesPanelChildrenProps> = ({
  attributionIds,
  multiSelectedAttributionIds,
  selectedAttributionIds,
  setMultiSelectedAttributionIds,
  selectedAttributionId,
}) => {
  const manualAttributions = useAppSelector(getManualAttributions);
  const [attributionIdsForReplacement, setAttributionIdsForReplacement] =
    useAttributionIdsForReplacement();
  const label = attributionIdsForReplacement.length
    ? text.packageLists.cancelReplace
    : text.packageLists.replace;

  useEffect(() => {
    if (
      attributionIdsForReplacement.length &&
      selectedAttributionId &&
      !(selectedAttributionId in manualAttributions)
    ) {
      setAttributionIdsForReplacement([]);
    }
  }, [
    attributionIdsForReplacement.length,
    manualAttributions,
    selectedAttributionId,
    setAttributionIdsForReplacement,
  ]);

  return (
    <MuiIconButton
      aria-label={label}
      disabled={
        !attributionIds ||
        !selectedAttributionIds.length ||
        !(attributionIds.length - multiSelectedAttributionIds.length) ||
        attributionIds.length < 2
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
