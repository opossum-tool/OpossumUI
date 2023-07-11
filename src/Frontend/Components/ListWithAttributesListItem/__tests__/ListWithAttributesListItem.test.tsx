// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import {
  ListWithAttributesItem,
  ListWithAttributesItemAttribute,
} from '../../../types/types';
import { ListWithAttributesListItem } from '../ListWithAttributesListItem';
import React from 'react';
import { doNothing } from '../../../util/do-nothing';

describe('ListWithAttributesListItem', () => {
  it('renders', () => {
    const testAttributes: Array<ListWithAttributesItemAttribute> = [
      { text: 'attrib_00', id: 'test_id_0' },
      { text: 'attrib_01', id: 'test_id_1' },
    ];
    const testListItem: ListWithAttributesItem = {
      id: '12342354',
      text: 'React',
      attributes: testAttributes,
    };
    render(
      <ListWithAttributesListItem
        item={testListItem}
        key={'itemKey'}
        handleListItemClick={doNothing}
        isSelected={true}
        showChipsForAttributes={true}
        isFirstItem={false}
        isLastItem={false}
        listContainsSingleItem={false}
        emptyTextFallback={'emptyTextFallback'}
      />,
    );
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('attrib_00')).toBeInTheDocument();
    expect(screen.getByText('attrib_01')).toBeInTheDocument();
  });
});
