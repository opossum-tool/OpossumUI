// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { IconButton } from '../IconButton';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';

describe('Button', () => {
  test('renders a button', () => {
    render(
      <IconButton
        tooltipTitle={'Test'}
        placement="left"
        disabled={false}
        onClick={doNothing}
        icon={<div>Test Icon</div>}
      />
    );

    expect(screen.getByLabelText('Test'));
    expect(screen.getByText('Test Icon'));
  });
});
