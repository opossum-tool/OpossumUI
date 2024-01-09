// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import ListItemIcon from '@mui/material/ListItemIcon';
import MuiListItemText from '@mui/material/ListItemText';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { SxProps } from '@mui/system';
import { useState } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon } from '../../shared-styles';
import { useAuditingOptions } from './AuditingOptions.util';

const classes = {
  container: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  menuPaper: {
    overflow: 'visible',
    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
    mt: 1.5,
    '&:before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: '50%',
      width: 10,
      height: 10,
      bgcolor: 'background.paper',
      transform: 'translateY(-50%) rotate(45deg)',
      zIndex: 0,
    },
  },
} satisfies SxProps;

interface Props {
  packageInfo: DisplayPackageInfo;
  isEditable: boolean;
}

export function AuditingOptions({ packageInfo, isEditable }: Props) {
  const chips = useAuditingOptions({ packageInfo, isEditable });
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [pendingOptions, setPendingOptions] = useState<Array<string>>([]);
  const inactiveChips = chips.filter(
    ({ active, interactive }) => !active && interactive,
  );

  return chips.length ? (
    <>
      <MuiBox sx={classes.container}>
        {renderTriggerButton()}
        {renderActiveChips()}
      </MuiBox>
      {renderMenu()}
    </>
  ) : null;

  function renderTriggerButton() {
    return (
      isEditable &&
      !!inactiveChips.length && (
        <MuiChip
          label={text.auditingOptions.add}
          color={'primary'}
          icon={<AddIcon color="primary" sx={baseIcon} />}
          size={'small'}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-controls={anchorEl ? 'attribution-options-menu' : undefined}
          aria-haspopup={'true'}
          aria-expanded={anchorEl ? 'true' : undefined}
        />
      )
    );
  }

  function renderActiveChips() {
    return chips.map(
      (
        { label, icon, deleteIcon, active, onDelete, interactive, option },
        index,
      ) =>
        active ? (
          <MuiChip
            key={index}
            label={label}
            size={'small'}
            icon={icon}
            onDelete={interactive ? onDelete : undefined}
            data-testid={`auditing-option-${option}`}
            deleteIcon={deleteIcon}
          />
        ) : null,
    );
  }

  function renderMenu() {
    return (
      <MuiMenu
        anchorEl={anchorEl}
        id={'attribution-options-menu'}
        open={!!anchorEl}
        onClose={() => {
          setAnchorEl(undefined);
          pendingOptions.forEach((option) => {
            chips.find((chip) => chip.option === option)?.onAdd?.();
          });
          setPendingOptions([]);
        }}
        slotProps={{ paper: { elevation: 0, sx: classes.menuPaper } }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{ variant: 'menu', sx: { padding: 0 } }}
      >
        {renderInactiveChips()}
      </MuiMenu>
    );

    function renderInactiveChips() {
      return inactiveChips.map(({ label, icon, option }, index) => (
        <MuiMenuItem
          sx={{ padding: '12px' }}
          key={index}
          onClick={() => {
            option &&
              setPendingOptions((prev) =>
                prev.includes(option)
                  ? prev.filter((value) => value !== option)
                  : prev.concat(option),
              );
          }}
          divider={index + 1 !== inactiveChips.length}
          disableRipple
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <MuiListItemText
            primary={label}
            primaryTypographyProps={{ sx: { marginTop: '2px' } }}
          />
          <CheckIcon
            sx={{
              width: '20px',
              height: '20px',
              marginLeft: '16px',
              visibility:
                option && pendingOptions.includes(option)
                  ? undefined
                  : 'hidden',
            }}
          />
        </MuiMenuItem>
      ));
    }
  }
}
