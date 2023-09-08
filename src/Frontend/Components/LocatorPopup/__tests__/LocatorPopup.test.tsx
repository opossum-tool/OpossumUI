// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { screen } from '@testing-library/react';
import React from 'react';
import { LocatorPopup } from '../LocatorPopup';

describe('Locator popup ', () => {
  jest.useFakeTimers();

  it('renders', () => {
    renderComponentWithStore(<LocatorPopup />);
    expect(
      screen.getByText('Locate Signals', { exact: true }),
    ).toBeInTheDocument();
  });
});
