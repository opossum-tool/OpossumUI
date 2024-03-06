// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';

import { OpossumColors } from '../../shared-styles';
import { List } from '../List/List';
import { PACKAGE_CARD_HEIGHT } from '../PackageCard/PackageCard';

const MAX_NUMBER_OF_CARDS = 4;

export const CardList = styled(List)(({ data }) => {
  const height =
    Math.min(MAX_NUMBER_OF_CARDS, data?.length ?? 0) *
      (PACKAGE_CARD_HEIGHT + 1) +
    1;

  return {
    background: OpossumColors.lightestBlue,
    border: '1px solid rgba(0, 0, 0, 0.12)',
    boxSizing: 'border-box',
    maxHeight: height,
    minHeight: height,
    height,
  };
});
