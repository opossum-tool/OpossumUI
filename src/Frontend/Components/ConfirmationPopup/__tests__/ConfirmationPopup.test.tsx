// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { ConfirmationPopup } from '../ConfirmationPopup';
import { fireEvent, screen } from '@testing-library/react';
import { ButtonText } from '../../../enums/enums';

describe('The ConfirmationPopup', () => {
  it('renders and calls onClick function', () => {
    const onClick = jest.fn();
    const content = 'Confirmation Popup';
    const header = 'Confirmation Header';
    renderComponentWithStore(
      <ConfirmationPopup
        onConfirmation={onClick}
        content={content}
        header={header}
      />,
    );
    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.getByText(header)).toBeInTheDocument();
    fireEvent.click(screen.queryByText(ButtonText.Confirm) as Element);
    expect(onClick).toHaveBeenCalled();
  });
});
