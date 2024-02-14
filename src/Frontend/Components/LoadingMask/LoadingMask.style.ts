// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/system';

export const Anchor = styled('div')({
  position: 'relative',
  width: '100%',
  height: '100%',
});

export const Mask = styled('div')({
  position: 'absolute',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 100,
  opacity: 0.5,
  backgroundColor: 'white',
});
