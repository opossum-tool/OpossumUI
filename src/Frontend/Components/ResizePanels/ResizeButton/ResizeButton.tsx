// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { TRANSITION } from '../../../shared-styles';
import { HeaderIconButton } from '../ResizePanels.style';

interface ResizeButtonProps {
  onClick: () => void;
  invert: boolean;
  disabled?: boolean;
}

export const ResizeButton: React.FC<ResizeButtonProps> = ({
  onClick,
  invert,
  disabled,
}) => {
  return (
    <HeaderIconButton size={'small'} disabled={disabled} onClick={onClick}>
      <ExpandMoreIcon
        aria-label={invert ? 'go up' : 'go down'}
        fontSize={'small'}
        color={'secondary'}
        sx={{
          transition: TRANSITION,
          transform: invert ? 'rotate(180deg)' : undefined,
        }}
      />
    </HeaderIconButton>
  );
};
