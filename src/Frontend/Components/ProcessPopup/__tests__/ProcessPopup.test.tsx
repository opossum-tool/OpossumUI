// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  setLoading,
  writeLogMessage,
} from '../../../state/actions/view-actions/view-actions';
import { renderComponent } from '../../../test-helpers/render';
import { ProcessPopup } from '../ProcessPopup';

describe('ProcessPopup', () => {
  it('renders no dialog when loading is false', () => {
    renderComponent(<ProcessPopup />);

    expect(screen.queryByText(text.processPopup.title)).not.toBeInTheDocument();
  });

  it('renders dialog when loading is true', () => {
    renderComponent(<ProcessPopup />, { actions: [setLoading(true)] });

    expect(screen.getByText(text.processPopup.title)).toBeInTheDocument();
  });

  it('clears previous log messages when loading begins another time', () => {
    const date = faker.date.recent();
    const message = faker.lorem.sentence();

    const popup = <ProcessPopup />;

    const { store } = renderComponent(popup, {
      actions: [
        setLoading(true),
        writeLogMessage({
          date,
          message,
          level: 'info',
        }),
      ],
    });

    act(() => void store.dispatch(setLoading(false)));
    act(() => void store.dispatch(setLoading(true)));

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
