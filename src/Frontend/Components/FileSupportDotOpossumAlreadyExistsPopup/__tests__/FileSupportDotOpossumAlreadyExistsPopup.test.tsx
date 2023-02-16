// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { FileSupportDotOpossumAlreadyExistsPopup } from '../FileSupportDotOpossumAlreadyExistsPopup';
import { ButtonText } from '../../../enums/enums';

describe('FileSupportDotOpossumAlreadyExistsPopup', () => {
  it('renders', () => {
    const header = 'Warning: Outdated input file format';
    renderComponentWithStore(<FileSupportDotOpossumAlreadyExistsPopup />);
    expect(screen.getByText(header)).toBeInTheDocument();
  });
  it('sends correct signal to backend when clicking openDotOpossumButton', () => {
    renderComponentWithStore(<FileSupportDotOpossumAlreadyExistsPopup />);
    fireEvent.click(
      screen.getByRole('button', { name: ButtonText.OpenDotOpossumFile })
    );
    expect(global.window.electronAPI.openDotOpossumFile).toHaveBeenCalled();
  });
});
