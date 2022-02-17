// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Checkbox } from '../Checkbox';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { clickOnCheckbox } from '../../../test-helpers/general-test-helpers';

describe('The Checkbox', () => {
  test('renders', () => {
    const mockOnChange = jest.fn();
    const testLabel = 'Test Label';
    render(
      <Checkbox
        label={testLabel}
        disabled={false}
        checked={true}
        onChange={(event): void => {
          mockOnChange(event.target.checked);
        }}
      />
    );
    expect(mockOnChange).toHaveBeenCalledTimes(0);

    clickOnCheckbox(screen, testLabel);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });
});
