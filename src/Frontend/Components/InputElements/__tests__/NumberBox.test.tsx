// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ChangeEvent } from 'react';
import { render, screen } from '@testing-library/react';
import { NumberBox } from '../NumberBox';
import { doNothing } from '../../../util/do-nothing';

describe('The NumberBox', () => {
  it('renders value and label', () => {
    render(
      <NumberBox
        title={'Test Title'}
        value={13}
        handleChange={
          doNothing as unknown as (
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => void
        }
      />,
    );

    expect(screen.queryAllByText('Test Title')).toHaveLength(2);
    expect(screen.getByDisplayValue('13'));
  });
});
