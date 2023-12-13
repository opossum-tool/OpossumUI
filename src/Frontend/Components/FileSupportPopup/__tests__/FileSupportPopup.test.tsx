// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { ButtonText } from '../../../enums/enums';
import { renderComponent } from '../../../test-helpers/render';
import { FileSupportPopup } from '../FileSupportPopup';

describe('FileSupportPopup', () => {
  it('renders', () => {
    const header = 'Warning: Outdated input file format';
    renderComponent(<FileSupportPopup />);
    expect(screen.getByText(header)).toBeInTheDocument();
  });

  it('sends correct signal to backend when clicking createAndProceedButton', () => {
    renderComponent(<FileSupportPopup />);
    fireEvent.click(
      screen.getByRole('button', { name: ButtonText.CreateAndProceed }),
    );
    expect(
      global.window.electronAPI.convertInputFileToDotOpossum,
    ).toHaveBeenCalled();
  });

  it('sends correct signal to backend when clicking keepButton', () => {
    renderComponent(<FileSupportPopup />);
    fireEvent.click(screen.getByRole('button', { name: ButtonText.Keep }));
    expect(
      global.window.electronAPI.useOutdatedInputFileFormat,
    ).toHaveBeenCalled();
  });
});
