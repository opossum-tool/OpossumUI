// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';

import { clickableIcon } from '../../shared-styles';
import { IconButton } from '../IconButton/IconButton';

const classes = {
  bigRevertIcon: {
    ...clickableIcon,
    width: 24,
    height: 24,
    margin: 0,
  },
};

interface EndIconProps {
  variant: 'undo' | 'redo';
  onClick: () => void;
  size?: 'small' | 'big';
  'data-testid'?: string;
}

export function DiffEndIcon({
  variant,
  onClick,
  'data-testid': dataTestId,
  size = 'small',
}: EndIconProps) {
  const Icon = variant === 'undo' ? UndoIcon : RedoIcon;
  return (
    <IconButton
      onClick={onClick}
      icon={
        <Icon sx={size === 'small' ? clickableIcon : classes.bigRevertIcon} />
      }
      data-testid={dataTestId}
    />
  );
}
