// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { ButtonText } from '../../../enums/enums';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { ChangedInputFilePopup } from '../ChangedInputFilePopup';

describe('ChangedInputFilePopup', () => {
  it('renders a ChangedInputFilePopup and clicks Delete', () => {
    const content =
      'The input file has changed. Do you want to keep the old attribution file or delete it?';

    const { store } = renderComponent(<ChangedInputFilePopup />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();

    expect(screen.getByText(ButtonText.Delete)).toBeInTheDocument();
    fireEvent.click(screen.getByText(ButtonText.Delete));
    expect(window.electronAPI.deleteFile).toHaveBeenCalledTimes(1);
    expect(getOpenPopup(store.getState())).toBeNull();
  });

  it('renders a ChangedInputFilePopup and clicks Keep', () => {
    const content =
      'The input file has changed. Do you want to keep the old attribution file or delete it?';

    const { store } = renderComponent(<ChangedInputFilePopup />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();

    expect(screen.getByText(ButtonText.Keep)).toBeInTheDocument();
    fireEvent.click(screen.getByText(ButtonText.Keep));
    expect(window.electronAPI.keepFile).toHaveBeenCalledTimes(1);
    expect(getOpenPopup(store.getState())).toBeNull();
  });
});
