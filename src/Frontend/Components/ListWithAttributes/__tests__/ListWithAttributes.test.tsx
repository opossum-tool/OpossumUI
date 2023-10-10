// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, render, screen, within } from '@testing-library/react';
import { ListWithAttributes } from '../ListWithAttributes';
import { ListWithAttributesItem } from '../../../types/types';
import { doNothing } from '../../../util/do-nothing';

describe('ListWithAttributes', () => {
  it('renders with title and items containing name and attributes', () => {
    const testItems: Array<ListWithAttributesItem> = [
      {
        text: 'package_0',
        id: 'test_item_id_0',
        attributes: [
          { text: 'attrib_00', id: 'test_attribute_id_00' },
          { text: 'attrib_01', id: 'test_attribute_id_01' },
        ],
      },
      {
        text: 'package_1',
        id: 'test_item_id_1',
        attributes: [
          { text: 'attrib_10', id: 'test_attribute_id_10' },
          { text: 'attrib_11', id: 'test_attribute_id_11' },
        ],
      },
    ];
    const testSelectedItemId = '';
    const testHighlightedAttributeIds = [''];
    const testListTitle = 'Packages';
    render(
      <ListWithAttributes
        listItems={testItems}
        selectedListItemId={testSelectedItemId}
        highlightedAttributeIds={testHighlightedAttributeIds}
        handleListItemClick={doNothing}
        showChipsForAttributes={true}
        showAddNewListItem={false}
        title={testListTitle}
      />,
    );

    expect(screen.getByText(testListTitle)).toBeInTheDocument();

    const listItemElement1 = within(screen.getAllByRole('listitem')[0]);
    expect(listItemElement1.getByText('package_0')).toBeInTheDocument();
    expect(listItemElement1.getByText('attrib_00')).toBeInTheDocument();
    expect(listItemElement1.getByText('attrib_01')).toBeInTheDocument();

    const listItemElement2 = within(screen.getAllByRole('listitem')[1]);
    expect(listItemElement2.getByText('package_1')).toBeInTheDocument();
    expect(listItemElement2.getByText('attrib_10')).toBeInTheDocument();
    expect(listItemElement2.getByText('attrib_11')).toBeInTheDocument();
  });

  it('renders a text field for adding new list items', () => {
    const testItems: Array<ListWithAttributesItem> = [
      {
        text: '',
        id: '',
        attributes: [{ text: '', id: '' }],
      },
    ];
    const testSelectedItemId = '';
    const testHighlightedAttributeIds = [''];
    const testListTitle = '';

    render(
      <ListWithAttributes
        listItems={testItems}
        selectedListItemId={testSelectedItemId}
        highlightedAttributeIds={testHighlightedAttributeIds}
        handleListItemClick={doNothing}
        showChipsForAttributes={false}
        showAddNewListItem={true}
        title={testListTitle}
      />,
    );

    expect(screen.queryAllByText('Add new item')).toHaveLength(2);
    const textBox = screen.getByRole('textbox');
    const iconButton = screen.getByRole('button', {
      name: 'Enter text to add a new item to the list',
    });
    expect(iconButton).toBeDisabled();

    fireEvent.change(textBox, { target: { value: 'abc' } });
    expect(iconButton).toBeEnabled();

    fireEvent.change(textBox, { target: { value: '     ' } });
    expect(iconButton).toBeDisabled();
  });
});
