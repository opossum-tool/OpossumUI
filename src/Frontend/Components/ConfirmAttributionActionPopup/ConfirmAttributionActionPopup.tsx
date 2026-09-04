// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiButton, { type ButtonProps } from '@mui/material/Button';
import MuiTypography from '@mui/material/Typography';

import type {
  AllMatchingAttributionSelection,
  AttributionSelection,
} from '../../../shared/attribution-selection';
import type { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionCardList } from '../AttributionCardList/AttributionCardList';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';
import type { LinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';
import { StyledConfirmAttributionActionPopup } from './ConfirmAttributionActionPopup.style';
import { useAttributionPreview } from './use-attribution-preview';

interface Action {
  buttonText: string;
  onClick: () => void;
  isPending: boolean;
  color?: ButtonProps['color'];
  available?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  header: string;
  ariaLabel: string;
  description: string;
  mixedWarning: string;
  attributions: Attributions | undefined;
  localAction?: Action;
  globalAction: Action;
  linkedResourcesTreeState: LinkedResourcesTreeState;
  mixedAttributionCount: number;
  isResourceInfoReady: boolean;
  isLocalActionAvailable: boolean | undefined;
  selection: AttributionSelection;
  attributionCount?: number;
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
  selection,
  attributionCount,
}: Props) {
  const isMutationPending =
    globalAction.isPending || (localAction?.isPending ?? false);
  const isLocalActionVisible =
    localAction &&
    ((localAction.available ?? isLocalActionAvailable) ||
      localAction.isPending);
  const attributionValues = attributions && Object.values(attributions);

  return (
    <StyledConfirmAttributionActionPopup
      header={header}
      leftButtonConfig={
        isLocalActionVisible
          ? {
              disabled: isMutationPending || !isResourceInfoReady,
              loading: localAction.isPending,
              onClick: localAction.onClick,
              buttonText: localAction.buttonText,
              color: localAction.color,
            }
          : undefined
      }
      centerLeftButtonConfig={{
        disabled: isMutationPending || !isResourceInfoReady,
        loading: globalAction.isPending,
        onClick: globalAction.onClick,
        buttonText: globalAction.buttonText,
        color: globalAction.color,
      }}
      rightButtonConfig={{
        disabled: isMutationPending,
        onClick: onClose,
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={ariaLabel}
      width={580}
    >
      {mixedAttributionCount > 0 && (
        <MuiAlert severity={'warning'}>{mixedWarning}</MuiAlert>
      )}
      <MuiTypography>{description}</MuiTypography>
      {selection?.mode === 'allMatching' ? (
        <AttributionPreview
          selection={selection}
          open={open}
          attributionCount={attributionCount}
        />
      ) : (
        <>
          {attributionValues ? (
            <AttributionCardList attributions={attributionValues} />
          ) : (
            <MuiTypography>{text.updateAppPopup.loading}</MuiTypography>
          )}
          <MuiTypography variant={'subtitle2'}>
            {mixedAttributionCount > 0
              ? text.confirmAttributionActionPopup.editableLinkedResources
              : text.confirmAttributionActionPopup.linkedResources}
          </MuiTypography>
          <LinkedResourcesTree
            readOnly
            disableHighlightSelected={!isLocalActionAvailable}
            state={linkedResourcesTreeState}
            sx={{ minHeight: '100px' }}
          />
        </>
      )}
    </StyledConfirmAttributionActionPopup>
  );
}

function AttributionPreview({
  open,
  selection,
  attributionCount,
}: {
  open: boolean;
  selection: AllMatchingAttributionSelection;
  attributionCount?: number;
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
    return <MuiTypography>{text.updateAppPopup.loading}</MuiTypography>;
  }

  return (
    <AttributionCardList
      attributions={Object.values(preview.attributions)}
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
      fillAvailableHeight
    />
  );
}
