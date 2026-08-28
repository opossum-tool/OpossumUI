// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import type { PackageInfo } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { applyFocusedAttributionOutcome } from '../../../../state/actions/resource-actions/navigation-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getSelectedAttributionId,
  getTemporaryDisplayPackageInfo,
} from '../../../../state/selectors/resource-selectors';
import { backend } from '../../../../util/backendClient';
import {
  ExcludeFromNoticeIcon,
  FollowUpIcon,
  NeedsReviewIcon,
} from '../../../Icons/Icons';
import {
  SelectMenu,
  type SelectMenuOption,
} from '../../../SelectMenu/SelectMenu';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

type UpdatablePropertyType = keyof Pick<
  PackageInfo,
  'needsReview' | 'followUp' | 'excludeFromNotice'
>;

interface MenuItemConfig {
  property: UpdatablePropertyType;
  icon: React.ReactElement;
}

const menuItemConfigs: Array<MenuItemConfig> = [
  {
    property: 'needsReview',
    icon: <NeedsReviewIcon />,
  },
  {
    property: 'followUp',
    icon: <FollowUpIcon />,
  },
  {
    property: 'excludeFromNotice',
    icon: <ExcludeFromNoticeIcon />,
  },
];

export const MoreActionsButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  pickerMode,
  selectedAttributionIds,
  selection,
  selectionSummary,
  selectionSummaryLoading,
  clearSelection,
}) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();

  const updateAttributionProperty =
    backend.updateAttributionProperty.useMutation({
      onBeforeInvalidation: ({ focusedAttributionOutcome }) =>
        dispatch(applyFocusedAttributionOutcome(focusedAttributionOutcome)),
      onSuccess: clearSelection,
    });
  const mutationsPending = useIsMutating() > 0;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const propertyStates = useMemo(() => {
    const checkProperty = (property: UpdatablePropertyType): boolean => {
      if (
        !selectedAttributionIds.length &&
        (selection.mode !== 'allMatching' || !selectionSummary?.selectedCount)
      ) {
        return false;
      }
      if (selection.mode === 'allMatching') {
        if (!selectionSummary) {
          return false;
        }
        return (
          {
            needsReview: selectionSummary.needsReviewCount,
            followUp: selectionSummary.followUpCount,
            excludeFromNotice: selectionSummary.excludeFromNoticeCount,
          }[property] === selectionSummary.selectedCount
        );
      }
      if (
        !attributions ||
        selectedAttributionIds.some((id) => !attributions[id])
      ) {
        return false;
      }

      return selectedAttributionIds.every((id) => attributions[id]?.[property]);
    };

    return {
      needsReview: checkProperty('needsReview'),
      followUp: checkProperty('followUp'),
      excludeFromNotice: checkProperty('excludeFromNotice'),
    };
  }, [attributions, selectedAttributionIds, selection, selectionSummary]);

  const getMenuItemText = useCallback(
    (property: UpdatablePropertyType): string => {
      const isSet = propertyStates[property];
      const baseText = (
        {
          needsReview: text.auditingOptions.needsReview,
          followUp: text.auditingOptions.followUp,
          excludeFromNotice: text.auditingOptions.excludedFromNotice,
        } satisfies Record<UpdatablePropertyType, string>
      )[property];
      return isSet ? `Unmark as ${baseText}` : `Mark as ${baseText}`;
    },
    [propertyStates],
  );

  const handlePropertyToggle = useCallback(
    (property: UpdatablePropertyType) => {
      const newState = !propertyStates[property];

      updateAttributionProperty.mutate({
        selection,
        property,
        value: newState,
        attributions: selectedAttributionId
          ? { [selectedAttributionId]: temporaryDisplayPackageInfo }
          : undefined,
        focusedAttributionUuid: selectedAttributionId,
      });
      handleClose();
    },
    [
      propertyStates,
      selection,
      selectedAttributionId,
      temporaryDisplayPackageInfo,
      updateAttributionProperty,
    ],
  );

  const menuOptions = useMemo<Array<SelectMenuOption>>(
    () =>
      menuItemConfigs.map((config) => ({
        id: config.property,
        label: getMenuItemText(config.property),
        icon: config.icon,
        selected: false, // No checkmarks for action menu
        onAdd: () => handlePropertyToggle(config.property),
      })),
    [getMenuItemText, handlePropertyToggle],
  );

  return (
    <>
      <MuiIconButton
        aria-label={text.packageLists.moreActions}
        disabled={
          !(selection.mode === 'allMatching'
            ? selectionSummary?.selectedCount
            : selectedAttributionIds.length) ||
          selectionSummaryLoading ||
          pickerMode.isActive ||
          mutationsPending
        }
        onClick={handleClick}
        loading={updateAttributionProperty.isPending}
        size={'small'}
      >
        <MuiTooltip
          title={text.packageLists.moreActions}
          disableInteractive
          placement={'top'}
        >
          <MoreHorizIcon />
        </MuiTooltip>
      </MuiIconButton>
      <SelectMenu
        anchorEl={anchorEl}
        anchorPosition="center"
        options={menuOptions}
        setAnchorEl={setAnchorEl}
      />
    </>
  );
};
