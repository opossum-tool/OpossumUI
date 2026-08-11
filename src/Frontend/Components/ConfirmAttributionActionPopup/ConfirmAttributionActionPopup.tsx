// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import type { ButtonProps } from '@mui/material/Button';
import MuiTypography from '@mui/material/Typography';

import type { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionCardList } from '../AttributionCardList/AttributionCardList';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';
import type { LinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';
import { StyledConfirmAttributionActionPopup } from './ConfirmAttributionActionPopup.style';

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
      {attributionValues ? (
        <AttributionCardList attributions={attributionValues} />
      ) : (
        <MuiTypography>{text.updateAppPopup.loading}</MuiTypography>
      )}
      <LinkedResourcesTree
        readOnly
        disableHighlightSelected={!isLocalActionAvailable}
        state={linkedResourcesTreeState}
        sx={{ minHeight: '100px' }}
      />
    </StyledConfirmAttributionActionPopup>
  );
}
