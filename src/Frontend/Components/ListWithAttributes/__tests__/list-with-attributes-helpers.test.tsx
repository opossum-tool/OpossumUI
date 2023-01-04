// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getAttributesWithHighlighting } from '../list-with-attributes-helpers';
import { cleanup, render, screen } from '@testing-library/react';
import { ListWithAttributesItemAttribute } from '../../../types/types';

describe('getAttributesWithHighlighting', () => {
  it('yields correct components', () => {
    const testAttributes: Array<ListWithAttributesItemAttribute> = [
      { text: 'attrib_00', id: 'test_id_0' },
      { text: 'attrib_01', id: 'test_id_1' },
    ];
    const testHighlightedAttributeIds = ['test_id_1'];

    const resultingComponents = getAttributesWithHighlighting(
      testAttributes,
      testHighlightedAttributeIds
    );

    render(resultingComponents[0]);
    expect(screen.getByText('attrib_00')).toBeInTheDocument();

    cleanup();
    render(resultingComponents[1]);
    expect(screen.getByText('attrib_01')).toBeInTheDocument();
  });
});
