// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useIsMutating } from '@tanstack/react-query';
import { useRef } from 'react';

import type { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { backend } from '../../util/backendClient';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../../util/use-focused-attribution-outcome';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ComparisonView } from './ComparisonView';
import type { ComparisonItem } from './DiffPopup.util';
import { useComparisonState } from './use-comparison-state';

export type { ComparisonItem } from './DiffPopup.util';

export interface DiffPopupProps {
  leftItem: ComparisonItem;
  rightItem: ComparisonItem;
  ariaLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (acceptedAttributions: Attributions) => void;
}

export function DiffPopup({
  leftItem,
  rightItem,
  isOpen,
  ...props
}: DiffPopupProps) {
  if (!isOpen) {
    return null;
  }
  return (
    <DiffPopupSession
      key={JSON.stringify([leftItem.packageInfo.id, rightItem.packageInfo.id])}
      leftItem={leftItem}
      rightItem={rightItem}
      isOpen={isOpen}
      {...props}
    />
  );
}

function DiffPopupSession({
  leftItem,
  rightItem,
  ariaLabel = text.diffPopup.ariaLabel,
  isOpen,
  onClose,
  onSaveSuccess,
}: DiffPopupProps) {
  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const acceptedAttributionsRef = useRef<Attributions>({});
  const updateOrMatch = backend.updateOrMatchAttributions.useMutation({
    onBeforeInvalidation: (result) => {
      onSaveSuccess?.(acceptedAttributionsRef.current);
      handleFocusedAttributionOutcome(result);
    },
  });
  const isSaving = updateOrMatch.isPending;
  const isBusy = useIsMutating() > 0;
  const comparison = useComparisonState(leftItem, rightItem, isBusy);

  async function handleSave() {
    if (isBusy || !comparison.canSave) {
      return;
    }
    if (Object.keys(comparison.mutationCandidates).length > 0) {
      acceptedAttributionsRef.current = comparison.acceptedAttributions;
      await updateOrMatch.mutateAsync({
        attributions: comparison.mutationCandidates,
        focusedAttributionUuid: comparison.items.right.packageInfo.id,
      });
    } else {
      onSaveSuccess?.(comparison.acceptedAttributions);
    }
    onClose();
  }

  function handleDismiss() {
    if (!isBusy) {
      onClose();
    }
  }

  return (
    <NotificationPopup
      header={text.diffPopup.title}
      isOpen={isOpen}
      onBackdropClick={handleDismiss}
      onEscapeKeyDown={handleDismiss}
      aria-label={ariaLabel}
      background={'lightestBlue'}
      fullWidth={true}
      width={'min(1200px, calc(100vw - 32px))'}
      height={'calc(100vh - 64px)'}
      titleSx={{ padding: '8px 24px 6px' }}
      actionsSx={{ padding: '4px 8px' }}
      sx={{
        background: OpossumColors.almostWhiteBlue,
        padding: 0,
      }}
      leftButtonConfig={{
        buttonText: text.buttons.cancel,
        color: 'secondary',
        disabled: isBusy,
        onClick: handleDismiss,
      }}
      rightButtonConfig={{
        buttonText: text.diffPopup.saveChanges,
        color: 'primary',
        disabled: !comparison.canSave || isBusy,
        loading: isSaving,
        onClick: handleSave,
      }}
    >
      <ComparisonView
        items={comparison.items}
        drafts={comparison.drafts}
        dirty={comparison.dirty}
        isBusy={isBusy}
        onChange={comparison.onChange}
        onCopy={comparison.onCopy}
        onUndo={comparison.onUndo}
        onUndoAuditing={comparison.onUndoAuditing}
      />
    </NotificationPopup>
  );
}
