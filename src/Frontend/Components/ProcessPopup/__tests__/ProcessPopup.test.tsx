// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  setLoading,
  setLogMessage,
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

    const { store, rerender } = renderComponent(popup, {
      actions: [
        setLoading(true),
        setLogMessage({
          date,
          message,
          level: 'info',
        }),
      ],
    });

    store.dispatch(setLoading(false));
    rerender(popup);
    store.dispatch(setLoading(true));
    rerender(popup);

    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
