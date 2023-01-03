// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiBox from '@mui/material/Box';
import { ListWithAttributesItemAttribute } from '../../types/types';

export function getAttributesWithHighlighting(
  attributes: Array<ListWithAttributesItemAttribute>,
  highlightedAttributeIds: Array<string>
): Array<ReactElement> {
  const styleBasic = {
    padding: '0px 1px 0px 2px',
    marginLeft: '5px',
  };
  const styleHighlighted = {
    border: 1,
  };

  return attributes.map((attribute, attributeIndex) => (
    <React.Fragment key={`attributeId-${attribute.id}`}>
      {attributeIndex === 0 ? '' : ','}
      <MuiBox
        sx={{
          ...styleBasic,
          ...(highlightedAttributeIds.includes(attribute.id)
            ? styleHighlighted
            : {}),
        }}
      >
        {attribute.text}
      </MuiBox>
    </React.Fragment>
  ));
}
