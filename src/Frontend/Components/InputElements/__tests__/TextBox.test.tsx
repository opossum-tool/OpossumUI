// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent } from 'react';
import { render } from '@testing-library/react';
import { TextBox } from '../TextBox';
import { doNothing } from '../../../util/do-nothing';

describe('The TextBox', () => {
  test('renders text and label', () => {
    const { queryAllByText, getByDisplayValue } = render(
      <TextBox
        title={'Test Title'}
        text={'Test Content'}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => void
        }
      />
    );

    expect(queryAllByText('Test Title')).toHaveLength(2);
    expect(getByDisplayValue('Test Content'));
  });
});
