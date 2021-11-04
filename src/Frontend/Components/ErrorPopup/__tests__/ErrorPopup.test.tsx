// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ErrorPopup } from '../ErrorPopup';
import { screen } from '@testing-library/react';

describe('Error popup ', () => {
  test('renders', () => {
    renderComponentWithStore(<ErrorPopup content="Invalid link." />);

    expect(screen.getByText('Error')).toBeTruthy();
  });
});
