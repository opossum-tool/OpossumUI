// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo } from 'react';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import { useAppSelector } from '../../state/hooks';
import {
  getSelectedAttributionId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { ConfirmSavePopup, type SaveMutationResult } from './ConfirmSavePopup';

interface Props {
  selection: AttributionSelection;
  open: boolean;
  onClose: () => void;
  onAcceptDrafts?: () => void;
  clearSelection?: () => void;
  onSaveComplete?: (result: SaveMutationResult) => void;
}

export function AttributionFormConfirmSavePopup({
  selection,
  open,
  onClose,
  onAcceptDrafts,
  clearSelection,
  onSaveComplete,
}: Props) {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const attributions = useMemo(
    () =>
      selectedAttributionId &&
      temporaryDisplayPackageInfo.id === selectedAttributionId
        ? { [selectedAttributionId]: temporaryDisplayPackageInfo }
        : undefined,
    [selectedAttributionId, temporaryDisplayPackageInfo],
  );
  const handleSaveComplete = useCallback(
    (result: SaveMutationResult) => {
      clearSelection?.();
      onSaveComplete?.(result);
    },
    [clearSelection, onSaveComplete],
  );

  return (
    <ConfirmSavePopup
      selection={selection}
      open={open}
      onClose={onClose}
      attributions={attributions}
      focusedAttributionUuid={selectedAttributionId || undefined}
      onAcceptDrafts={onAcceptDrafts}
      onSaveComplete={handleSaveComplete}
    />
  );
}
