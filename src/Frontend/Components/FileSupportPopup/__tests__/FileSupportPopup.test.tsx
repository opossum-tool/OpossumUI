// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { screen } from '@testing-library/react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { FileSupportPopup, HEADER } from '../FileSupportPopup';

describe('FileSupportPopup', () => {
  it('renders', () => {
    renderComponentWithStore(<FileSupportPopup />);
    expect(screen.getByText(HEADER)).toBeInTheDocument();
  });
});
