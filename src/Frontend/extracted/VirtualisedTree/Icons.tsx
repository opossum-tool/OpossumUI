// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';

interface NodeIconProps {
  sx?: SxProps;
  ariaLabel: string;
  onClick: () => void;
  icon: ReactElement;
}

export function NodeIcon(props: NodeIconProps): ReactElement {
  return (
    <MuiBox
      sx={props.sx}
      onClick={(event): void => {
        event.stopPropagation();
        props.onClick();
      }}
      aria-label={props.ariaLabel}
    >
      {props.icon}
    </MuiBox>
  );
}
