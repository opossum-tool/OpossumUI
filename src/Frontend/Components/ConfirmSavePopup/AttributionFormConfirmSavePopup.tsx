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
import { ConfirmSavePopup } from './ConfirmSavePopup';

interface Props {
  selection: AttributionSelection;
  open: boolean;
  onClose: () => void;
  clearSelection?: () => void;
}

export function AttributionFormConfirmSavePopup({
  selection,
  open,
  onClose,
  clearSelection,
}: Props) {
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const attributions = useMemo(
    () =>
      selectedAttributionId
        ? { [selectedAttributionId]: temporaryDisplayPackageInfo }
        : undefined,
    [selectedAttributionId, temporaryDisplayPackageInfo],
  );
  const handleSaveComplete = useCallback(() => {
    clearSelection?.();
  }, [clearSelection]);

  return (
    <ConfirmSavePopup
      selection={selection}
      open={open}
      onClose={onClose}
      attributions={attributions}
      focusedAttributionUuid={selectedAttributionId || undefined}
      onSaveComplete={handleSaveComplete}
    />
  );
}
