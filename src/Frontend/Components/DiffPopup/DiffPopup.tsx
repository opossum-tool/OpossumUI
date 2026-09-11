// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useIsMutating } from '@tanstack/react-query';
import { useState } from 'react';

import type { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { useConfirmAttributionEdit } from '../AttributionDetails/use-confirm-attribution-edit';
import { ConfirmSavePopup } from '../ConfirmSavePopup/ConfirmSavePopup';
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
  onAcceptDrafts?: (acceptedAttributions: Attributions) => void;
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
  onAcceptDrafts,
}: DiffPopupProps) {
  const isBusy = useIsMutating() > 0;
  const [saveRequest, setSaveRequest] = useState<{
    acceptedAttributions: Attributions;
    mutationCandidates: Attributions;
    focusedAttributionUuid: string;
  }>();
  const comparison = useComparisonState(leftItem, rightItem, isBusy);
  const leftEdit = useConfirmAttributionEdit(
    comparison.drafts.left,
    comparison.items.left.label,
  );
  const rightEdit = useConfirmAttributionEdit(
    comparison.drafts.right,
    comparison.items.right.label,
  );
  const isChildOpen =
    Boolean(saveRequest) || leftEdit.isOpen || rightEdit.isOpen;

  function handleSave() {
    if (isBusy || isChildOpen || !comparison.canSave) {
      return;
    }
    if (Object.keys(comparison.mutationCandidates).length > 0) {
      setSaveRequest({
        acceptedAttributions: comparison.acceptedAttributions,
        mutationCandidates: comparison.mutationCandidates,
        focusedAttributionUuid: comparison.items.right.packageInfo.id,
      });
    } else {
      onAcceptDrafts?.(comparison.acceptedAttributions);
      onClose();
    }
  }

  function handleDismiss() {
    if (!isBusy && !isChildOpen) {
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
        disabled: isBusy || isChildOpen,
        onClick: handleDismiss,
      }}
      rightButtonConfig={{
        buttonText: text.diffPopup.saveChanges,
        color: 'primary',
        disabled: !comparison.canSave || isBusy || isChildOpen,
        onClick: handleSave,
      }}
    >
      <ComparisonView
        items={comparison.items}
        drafts={comparison.drafts}
        dirty={comparison.dirty}
        isBusy={isBusy || isChildOpen}
        onChange={comparison.onChange}
        onCopy={async (source, destination, key) =>
          (destination === 'left' ? leftEdit.confirm : rightEdit.confirm)(() =>
            comparison.onCopy(source, destination, key),
          )
        }
        onUndo={comparison.onUndo}
        onUndoAuditing={comparison.onUndoAuditing}
        editConfirmations={{ left: leftEdit.confirm, right: rightEdit.confirm }}
      />
      {leftEdit.dialog}
      {rightEdit.dialog}
      {saveRequest && (
        <ConfirmSavePopup
          selection={{
            mode: 'explicit',
            attributionUuids: Object.keys(saveRequest.mutationCandidates),
          }}
          open
          onClose={() => setSaveRequest(undefined)}
          attributions={saveRequest.mutationCandidates}
          focusedAttributionUuid={saveRequest.focusedAttributionUuid}
          allowLocalSave={false}
          action={'save'}
          onAcceptDrafts={() =>
            onAcceptDrafts?.(saveRequest.acceptedAttributions)
          }
          onSaveComplete={onClose}
        />
      )}
    </NotificationPopup>
  );
}
