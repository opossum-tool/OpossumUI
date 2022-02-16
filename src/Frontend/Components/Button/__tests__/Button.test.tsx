// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Button } from '../Button';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';

describe('Button', () => {
  test('renders a button', () => {
    render(
      <Button
        buttonText={'Test'}
        disabled={false}
        isDark={false}
        onClick={(): void => {
          doNothing();
        }}
      />
    );

    screen.getByText('Test');
  });
});
