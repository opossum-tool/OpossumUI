// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import {
  type Attributions,
  type PackageInfo,
} from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { useAppDispatch } from '../../../../state/hooks';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
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
import { type PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

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
  selectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();

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
        !attributions ||
        !selectedAttributionIds.length ||
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
  }, [attributions, selectedAttributionIds]);

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
    async (property: UpdatablePropertyType) => {
      if (!attributions) {
        return;
      }

      const newState = !propertyStates[property];

      const updatedAttributions = selectedAttributionIds.reduce(
        (acc, attributionId) => {
          const attribution = attributions[attributionId];
          acc[attributionId] = {
            ...attribution,
            [property]: newState,
          };
          return acc;
        },
        {} as Attributions,
      );

      await backend.updateAttributions.mutate({
        attributions: updatedAttributions,
      });

      handleClose();
    },
    [attributions, dispatch, selectedAttributionIds, propertyStates],
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
          !selectedAttributionIds.length ||
          !!attributionIdsForReplacement.length ||
          mutationsPending
        }
        onClick={handleClick}
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
