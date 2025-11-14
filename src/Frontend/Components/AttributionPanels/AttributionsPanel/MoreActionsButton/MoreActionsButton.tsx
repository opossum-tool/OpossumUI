// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MuiIconButton from '@mui/material/IconButton';
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiTooltip from '@mui/material/Tooltip';
import { useState } from 'react';

import { Attributions } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { updateAttributionsAndSave } from '../../../../state/actions/resource-actions/save-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { useAttributionIdsForReplacement } from '../../../../state/variables/use-attribution-ids-for-replacement';
import {
  ExcludeFromNoticeIcon,
  FollowUpIcon,
  NeedsReviewIcon,
} from '../../../Icons/Icons';
import { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

type updatablePropertyType = 'needsReview' | 'followUp' | 'excludeFromNotice';

export const MoreActionsButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  selectedAttributionIds,
}) => {
  const dispatch = useAppDispatch();
  const [attributionIdsForReplacement] = useAttributionIdsForReplacement();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isSetForAllSelectedAttributions = (
    property: updatablePropertyType,
  ): boolean => {
    if (!attributions) {
      return false;
    }
    const selectedAttributions = selectedAttributionIds.map(
      (id) => attributions[id],
    );

    return selectedAttributions.every((attr) => attr[property]);
  };

  const getMenuItemText = (property: updatablePropertyType): string => {
    const isSet = isSetForAllSelectedAttributions(property);
    const baseText = {
      needsReview: text.auditingOptions.needsReview,
      followUp: text.auditingOptions.followUp,
      excludeFromNotice: text.auditingOptions.excludedFromNotice,
    }[property];

    return isSet ? `Unmark as ${baseText}` : `Mark as ${baseText}`;
  };

  const handlePropertyToggle = (property: updatablePropertyType) => {
    if (!attributions) {
      return;
    }

    const newState = !isSetForAllSelectedAttributions(property);

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

    dispatch(updateAttributionsAndSave(updatedAttributions));

    handleClose();
  };

  return (
    <>
      <MuiIconButton
        aria-label={text.packageLists.moreActions}
        disabled={
          !selectedAttributionIds.length ||
          !!attributionIdsForReplacement.length
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
      <MuiMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'more-actions-button',
        }}
      >
        <MuiMenuItem onClick={() => handlePropertyToggle('needsReview')}>
          <MuiListItemIcon>
            <NeedsReviewIcon />
          </MuiListItemIcon>
          {getMenuItemText('needsReview')}
        </MuiMenuItem>
        <MuiMenuItem onClick={() => handlePropertyToggle('followUp')}>
          <MuiListItemIcon>
            <FollowUpIcon />
          </MuiListItemIcon>
          {getMenuItemText('followUp')}
        </MuiMenuItem>
        <MuiMenuItem onClick={() => handlePropertyToggle('excludeFromNotice')}>
          <MuiListItemIcon>
            <ExcludeFromNoticeIcon />
          </MuiListItemIcon>
          {getMenuItemText('excludeFromNotice')}
        </MuiMenuItem>
      </MuiMenu>
    </>
  );
};
