// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { renderComponent } from '../../../test-helpers/render';
import { NotificationBanner } from '../NotificationBanner';

describe('NotificationBanner', () => {
  it('renders a dismiss control with its accessible label when requested', async () => {
    const onDismiss = vi.fn();
    await renderComponent(
      <NotificationBanner
        severity={'info'}
        onDismiss={onDismiss}
        dismissLabel={'Dismiss update'}
      >
        {'Update available'}
      </NotificationBanner>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss update' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('omits the dismiss control when no callback is provided', async () => {
    await renderComponent(
      <NotificationBanner severity={'warning'}>
        {'Architecture warning'}
      </NotificationBanner>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
