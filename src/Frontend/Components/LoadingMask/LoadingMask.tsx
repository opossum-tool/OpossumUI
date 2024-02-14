// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';

import { Anchor, Mask } from './LoadingMask.style';

export interface LoadingMaskProps {
  active: boolean | undefined;
  children: React.ReactNode;
  sx?: SxProps;
}

export const LoadingMask: React.FC<LoadingMaskProps> = ({
  active,
  children,
  sx,
  ...props
}) => {
  return (
    <Anchor sx={sx}>
      <Mask hidden={!active} {...props} />
      {children}
    </Anchor>
  );
};
