// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { NotificationPopup } from '../../NotificationPopup/NotificationPopup';
import { Screenshot } from '../screenshot';

function getOpener(alt = 'License filters') {
  return screen.getByRole('button', {
    name: `${text.whatsNew.viewFullSize}: ${alt}`,
  });
}

function getViewer(alt = 'License filters') {
  return screen.getByRole('dialog', {
    name: `${text.whatsNew.screenshot}: ${alt}`,
  });
}

describe('Screenshot viewer', () => {
  it('keeps the preview capped and opens the original image without size constraints', async () => {
    await renderComponent(
      <Screenshot src="screenshot.png" alt="License filters">
        Select licenses to filter the list.
      </Screenshot>,
    );
    const preview = screen.getByRole('img', { name: 'License filters' });
    expect(parseFloat(getComputedStyle(preview).maxHeight)).toBe(
      window.innerHeight / 2,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.whatsNew.viewFullSize),
    ).not.toBeInTheDocument();

    await userEvent.click(preview);
    const viewer = getViewer();
    const image = within(viewer).getByRole('img', { name: 'License filters' });
    expect(image).toHaveAttribute('src', 'screenshot.png');
    expect(getComputedStyle(image).maxHeight).toBe('none');
    expect(getComputedStyle(image).maxWidth).toBe('none');
    expect(within(viewer).getByRole('region')).toHaveAttribute('tabindex', '0');
  });

  it('returns to the preview and caption when closed', async () => {
    await renderComponent(
      <Screenshot src="screenshot.png" alt="License filters">
        Select licenses to filter the list.
      </Screenshot>,
    );
    await userEvent.click(getOpener());
    await userEvent.click(
      within(getViewer()).getByRole('button', { name: text.buttons.close }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText('Select licenses to filter the list.'),
    ).toBeVisible();
    expect(
      screen.getByRole('img', { name: 'License filters' }),
    ).toHaveAttribute('src', 'screenshot.png');
  });

  it.each(['{Enter}', ' '])(
    'supports keyboard opening with %s, Escape, and returning focus to the image',
    async (key) => {
      await renderComponent(
        <Screenshot src="screenshot.png" alt="License filters" />,
      );
      const opener = getOpener();
      expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
      await userEvent.tab();
      expect(opener).toHaveFocus();
      await userEvent.keyboard(key);
      expect(getViewer()).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(opener).toHaveFocus();
    },
  );

  it('opens the selected screenshot when multiple previews are present', async () => {
    await renderComponent(
      <>
        <Screenshot src="first.png" alt="First screenshot" />
        <Screenshot src="second.png" alt="Second screenshot" />
      </>,
    );
    await userEvent.click(getOpener('Second screenshot'));
    expect(
      within(getViewer('Second screenshot')).getByRole('img'),
    ).toHaveAttribute('src', 'second.png');
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await userEvent.click(getOpener('First screenshot'));
    expect(
      within(getViewer('First screenshot')).getByRole('img'),
    ).toHaveAttribute('src', 'first.png');
  });

  it('can inspect a short update banner at its original resolution too', async () => {
    await renderComponent(<Screenshot src="update.png" alt="Update banner" />);
    await userEvent.click(getOpener('Update banner'));
    expect(within(getViewer('Update banner')).getByRole('img')).toHaveAttribute(
      'src',
      'update.png',
    );
  });

  it('closes only the image viewer when opened from the notes popup', async () => {
    const closeNotes = vi.fn();
    await renderComponent(
      <NotificationPopup
        header={text.whatsNew.title}
        aria-label={text.whatsNew.title}
        isOpen
        onEscapeKeyDown={closeNotes}
      >
        <Screenshot src="screenshot.png" alt="License filters" />
      </NotificationPopup>,
    );
    await userEvent.click(getOpener());
    fireEvent.keyDown(getViewer(), { key: 'Escape', code: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', {
          name: `${text.whatsNew.screenshot}: License filters`,
        }),
      ).not.toBeInTheDocument(),
    );
    expect(closeNotes).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: text.whatsNew.title }),
    ).toBeVisible();
  });
});
