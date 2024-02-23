// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';

export const Container = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  height: '100%',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
});

export const TextContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: 'fit-content',
  maxWidth: '600px',
});
