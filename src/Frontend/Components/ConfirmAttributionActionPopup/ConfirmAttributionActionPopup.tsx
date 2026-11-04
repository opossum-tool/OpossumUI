// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiButton, { type ButtonProps } from '@mui/material/Button';
import MuiTypography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import type {
  AllMatchingAttributionSelection,
  AttributionSelection,
} from '../../../shared/attribution-selection';
import type { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { attributionPopupMaxWidth } from '../../shared-styles';
import { AttributionCardList } from '../AttributionCardList/AttributionCardList';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  popupColumnContentSx,
  popupFixedSectionSx,
  popupScrollableContentSx,
  popupScrollableSectionSx,
} from '../NotificationPopup/NotificationPopup.style';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';
import type { LinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';
import { useAttributionPreview } from './use-attribution-preview';

interface Action {
  buttonText: string;
  onClick: () => void;
  isPending: boolean;
  disabled?: boolean;
  color?: ButtonProps['color'];
  available?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  header: string;
  ariaLabel: string;
  description: ReactNode;
  mixedWarning: string;
  attributions: Attributions | undefined;
  localAction?: Action;
  globalAction: Action;
  linkedResourcesTreeState: LinkedResourcesTreeState | undefined;
  mixedAttributionCount: number;
  isResourceInfoReady: boolean;
  isLocalActionAvailable: boolean | undefined;
  isCloseDisabled?: boolean;
  selection: AttributionSelection;
  attributionCount?: number;
  children?: ReactNode;
  attributionListTestId?: string;
}

export function ConfirmAttributionActionPopup({
  open,
  onClose,
  header,
  ariaLabel,
  description,
  mixedWarning,
  attributions,
  localAction,
  globalAction,
  linkedResourcesTreeState,
  mixedAttributionCount,
  isResourceInfoReady,
  isLocalActionAvailable,
  isCloseDisabled,
  selection,
  attributionCount,
  children,
  attributionListTestId = 'attribution-preview',
}: Props) {
  const isMutationPending =
    globalAction.isPending || (localAction?.isPending ?? false);
  const isLocalActionVisible =
    localAction &&
    ((localAction.available ?? isLocalActionAvailable) ||
      localAction.isPending);
  const attributionValues = attributions && Object.values(attributions);

  return (
    <NotificationPopup
      fullWidth
      maxWidth={attributionPopupMaxWidth}
      sx={popupColumnContentSx}
      header={header}
      leftButtonConfig={
        isLocalActionVisible
          ? {
              disabled:
                isMutationPending ||
                localAction.disabled ||
                !isResourceInfoReady,
              loading: localAction.isPending,
              onClick: localAction.onClick,
              buttonText: localAction.buttonText,
              color: localAction.color,
            }
          : undefined
      }
      centerLeftButtonConfig={{
        disabled:
          isMutationPending || globalAction.disabled || !isResourceInfoReady,
        loading: globalAction.isPending,
        onClick: globalAction.onClick,
        buttonText: globalAction.buttonText,
        color: globalAction.color,
      }}
      rightButtonConfig={{
        disabled: isMutationPending || isCloseDisabled,
        onClick: onClose,
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={ariaLabel}
    >
      {mixedAttributionCount > 0 && (
        <MuiAlert severity={'warning'} sx={popupFixedSectionSx}>
          {mixedWarning}
        </MuiAlert>
      )}
      <MuiTypography sx={popupFixedSectionSx}>{description}</MuiTypography>
      {selection?.mode === 'allMatching' ? (
        <AttributionPreview
          selection={selection}
          open={open}
          attributionCount={attributionCount}
          testId={attributionListTestId}
              sx={popupScrollableContentSx}
        />
      ) : (
        <>
          {attributionValues ? (
            <AttributionCardList
              attributions={attributionValues}
              testId={attributionListTestId}
              sx={popupScrollableContentSx}
            />
          ) : (
            <MuiTypography sx={popupFixedSectionSx}>
              {text.updateApp.loading}
            </MuiTypography>
          )}
        </>
      )}
      {children}
      {selection.mode === 'explicit' && (
        <MuiTypography variant={'subtitle2'} sx={popupFixedSectionSx}>
          {mixedAttributionCount > 0
            ? text.confirmAttributionActionPopup.editableLinkedResources
            : text.confirmAttributionActionPopup.linkedResources}
        </MuiTypography>
      )}
      {selection.mode === 'explicit' && linkedResourcesTreeState && (
        <LinkedResourcesTree
          readOnly
          fitContent
          disableHighlightSelected={!isLocalActionAvailable}
          state={linkedResourcesTreeState}
          sx={{
            ...popupScrollableSectionSx,
            ...(linkedResourcesTreeState.treeNodes.length > 0 && { minHeight: 0 }),
          }}
        />
      )}
    </NotificationPopup>
  );
}

function AttributionPreview({
  open,
  selection,
  attributionCount,
  testId,
}: {
  open: boolean;
  selection: AllMatchingAttributionSelection;
  attributionCount?: number;
  testId: string;
}) {
  const preview = useAttributionPreview(selection, open, attributionCount);

  if (preview.error) {
    return (
      <MuiButton size={'small'} onClick={() => void preview.retry()}>
        {'Retry'}
      </MuiButton>
    );
  }

  if (!preview.attributions) {
    return (
      <MuiTypography sx={popupFixedSectionSx}>
        {text.updateApp.loading}
      </MuiTypography>
    );
  }

  return (
    <AttributionCardList
      attributions={Object.values(preview.attributions)}
      testId={testId}
      totalCount={attributionCount}
      resultSetKey={preview.resultSetKey}
      loadingMore={preview.loadingMore}
      loadMoreError={preview.loadMoreError}
      onRetryLoadMore={(requiredEndIndex) =>
        void preview.fetchNextPage(requiredEndIndex)
      }
      endReached={
        preview.hasNextPage
          ? (requiredEndIndex) => void preview.fetchNextPage(requiredEndIndex)
          : undefined
      }
      sx={popupScrollableContentSx}
    />
  );
}
