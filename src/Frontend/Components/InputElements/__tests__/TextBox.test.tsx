// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import { ChangeEvent } from 'react';

import { doNothing } from '../../../util/do-nothing';
import { TextBox } from '../TextBox';

describe('The TextBox', () => {
  it('renders text and label', () => {
    render(
      <TextBox
        title={'Test Title'}
        text={'Test Content'}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expect(screen.queryAllByText('Test Title')).toHaveLength(2);
    expect(screen.getByDisplayValue('Test Content'));
  });

  it('renders icon', () => {
    render(
      <TextBox
        title={'Test Title'}
        text={'Test Content'}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
        endIcon={<div>Test Icon</div>}
      />,
    );

    expect(screen.getByText('Test Icon'));
  });
});
