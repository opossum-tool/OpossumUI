// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiChip from '@mui/material/Chip';
import { ListWithAttributesItemAttribute } from '../../types/types';
import { OpossumColors } from '../../shared-styles';

export function getAttributesWithHighlighting(
  attributes: Array<ListWithAttributesItemAttribute>,
  showChipsForAttributes: boolean,
  highlightedAttributeIds?: Array<string>
): Array<ReactElement> {
  const styleChips = {
    cursor: 'pointer',
    backgroundColor: OpossumColors.lightGrey,
    padding: '0px 8px',
    margin: '5px 5px 0px 0px',
    height: '22px',
    '.MuiChip-label': {
      padding: '0px',
      color: OpossumColors.black,
    },
  };
  const styleChipsHighlighted = {
    backgroundColor: OpossumColors.mediumGrey,
  };

  return attributes.map((attribute) => (
    <React.Fragment key={`attributeId-${attribute.id}`}>
      {showChipsForAttributes ? (
        <MuiChip
          clickable={false}
          label={attribute.text}
          variant={'filled'}
          size={'small'}
          sx={{
            ...styleChips,
            ...(highlightedAttributeIds?.includes(attribute.id)
              ? styleChipsHighlighted
              : {}),
          }}
        />
      ) : (
        attribute.text
      )}
    </React.Fragment>
  ));
}
