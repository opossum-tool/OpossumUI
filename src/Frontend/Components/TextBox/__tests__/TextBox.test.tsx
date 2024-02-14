// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';

import { TextBox } from '../TextBox';

describe('TextBox', () => {
  it('renders text and label', () => {
    render(<TextBox title={'Test Title'} text={'Test Content'} />);

    expect(screen.queryAllByText('Test Title')).toHaveLength(2);
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(
      <TextBox
        title={'Test Title'}
        text={'Test Content'}
        endIcon={<div>Test Icon</div>}
      />,
    );

    expect(screen.getByText('Test Icon')).toBeInTheDocument();
  });
});
