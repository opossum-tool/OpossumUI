// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import { SxProps, Theme } from '@mui/system';
import { useState } from 'react';

import { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { baseIcon } from '../../../shared-styles';
import { SelectMenu } from '../../SelectMenu/SelectMenu';
import { useAuditingOptions } from './AuditingOptions.util';

const classes = {
  container: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
} satisfies SxProps;

interface Props {
  packageInfo: PackageInfo;
  isEditable: boolean;
  sx?: SxProps<Theme>;
}

export function AuditingOptions({ packageInfo, isEditable, sx }: Props) {
  const options = useAuditingOptions({ packageInfo, isEditable });
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const unselectedOptions = options.filter(
    ({ selected, interactive }) => !selected && interactive,
  );

  return options.length ? (
    <>
      <MuiBox sx={{ ...classes.container, ...sx }}>
        {renderTriggerButton()}
        {renderSelectedOptions()}
      </MuiBox>
      <SelectMenu
        anchorArrow
        anchorEl={anchorEl}
        hideSelected
        setAnchorEl={setAnchorEl}
        options={options.filter(({ interactive }) => interactive)}
        multiple
      />
    </>
  ) : null;

  function renderTriggerButton() {
    return (
      isEditable &&
      !!unselectedOptions.length && (
        <MuiChip
          label={text.auditingOptions.add}
          color={'primary'}
          icon={<AddIcon color="primary" sx={baseIcon} />}
          size={'small'}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        />
      )
    );
  }

  function renderSelectedOptions() {
    return options
      .filter(({ selected }) => selected)
      .map(({ label, icon, deleteIcon, onDelete, interactive, id }, index) => (
        <MuiChip
          key={index}
          label={label}
          size={'small'}
          icon={icon}
          onDelete={interactive ? onDelete : undefined}
          data-testid={`auditing-option-${id}`}
          deleteIcon={deleteIcon}
        />
      ));
  }
}
