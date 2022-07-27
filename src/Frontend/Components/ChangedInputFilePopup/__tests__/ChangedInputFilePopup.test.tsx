// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { ButtonText } from '../../../enums/enums';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ChangedInputFilePopup } from '../ChangedInputFilePopup';

describe('ChangedInputFilePopup', () => {
  test('renders a ChangedInputFilePopup and clicks Overwrite', () => {
    const content =
      'The input file has changed. Do you want to update the output file and continue to use it or completely overwrite it?';

    const { store } = renderComponentWithStore(<ChangedInputFilePopup />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();

    expect(screen.getByText(ButtonText.Overwrite));
    fireEvent.click(screen.getByText(ButtonText.Overwrite));
    expect(window.electronAPI.overwriteFile).toHaveBeenCalledTimes(1);
    expect(getOpenPopup(store.getState())).toBe(null);
  });

  test('renders a ChangedInputFilePopup and clicks Update', () => {
    const content =
      'The input file has changed. Do you want to update the output file and continue to use it or completely overwrite it?';

    const { store } = renderComponentWithStore(<ChangedInputFilePopup />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();

    expect(screen.getByText(ButtonText.Update));
    fireEvent.click(screen.getByText(ButtonText.Update));
    expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
    expect(getOpenPopup(store.getState())).toBe(null);
  });
});
