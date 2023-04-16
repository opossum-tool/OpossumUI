// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { FileSupportPopup } from '../FileSupportPopup';
import { ButtonText } from '../../../enums/enums';

describe('FileSupportPopup', () => {
  it('renders', () => {
    const header = 'Warning: Outdated input file format';
    renderComponentWithStore(<FileSupportPopup />);
    expect(screen.getByText(header)).toBeInTheDocument();
  });

  it('sends correct signal to backend when clicking createAndProceedButton', () => {
    renderComponentWithStore(<FileSupportPopup />);
    fireEvent.click(
      screen.getByRole('button', { name: ButtonText.CreateAndProceed })
    );
    expect(
      global.window.electronAPI.convertInputFileToDotOpossum
    ).toHaveBeenCalled();
  });

  it('sends correct signal to backend when clicking keepButton', () => {
    renderComponentWithStore(<FileSupportPopup />);
    fireEvent.click(screen.getByRole('button', { name: ButtonText.Keep }));
    expect(
      global.window.electronAPI.useOutdatedInputFileFormat
    ).toHaveBeenCalled();
  });
});
