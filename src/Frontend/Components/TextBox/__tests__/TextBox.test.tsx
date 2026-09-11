// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('forwards the readOnly state to the input', () => {
    render(<TextBox title={'Test Title'} text={'Test Content'} readOnly />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('readonly');
  });

  it('preserves multiline focus and selection when the end icon changes', async () => {
    const user = userEvent.setup();
    const props = {
      title: 'Comment',
      text: 'Test Content',
      multiline: true,
      minRows: 3,
      maxRows: 5,
    };
    const { rerender } = render(<TextBox {...props} />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{ArrowLeft}');

    rerender(<TextBox {...props} endIcon={<button>Undo</button>} />);

    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveProperty('selectionStart', 11);
    expect(input).toHaveProperty('selectionEnd', 11);

    rerender(<TextBox {...props} />);

    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveProperty('selectionStart', 11);
    expect(input).toHaveProperty('selectionEnd', 11);
  });
});
