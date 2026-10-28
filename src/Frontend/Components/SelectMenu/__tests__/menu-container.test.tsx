// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItem } from '@mui/material';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { renderComponent } from '../../../test-helpers/render';
import { MenuContainer } from '../menu-container';

function Example() {
  const [anchor, setAnchor] = useState<HTMLElement>();
  return (
    <>
      <button onClick={(event) => setAnchor(event.currentTarget)}>Open</button>
      <MenuContainer
        anchorEl={anchor}
        onClose={() => setAnchor(undefined)}
        adjacentContent={
          <>
            <button>First panel control</button>
            <button>Second panel control</button>
          </>
        }
      >
        <MenuItem>First</MenuItem>
        <MenuItem>Second</MenuItem>
      </MenuContainer>
    </>
  );
}

describe('MenuContainer', () => {
  it.each(['{Escape}', '{Tab}', '{Shift>}{Tab}{/Shift}'])(
    'dismisses with %s and restores focus',
    async (key) => {
      await renderComponent(<Example />);
      const trigger = screen.getByRole('button', { name: 'Open' });
      await userEvent.click(trigger);
      expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Second' })).toHaveFocus();
      await userEvent.keyboard(key);
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );
  it('dismisses on backdrop click', async () => {
    await renderComponent(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    fireEvent.click(
      within(screen.getByRole('presentation')).getAllByRole('generic', {
        hidden: true,
      })[0],
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
  it('keeps the menu open when tabbing in adjacent content', async () => {
    await renderComponent(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    screen.getByRole('button', { name: 'First panel control' }).focus();
    await userEvent.keyboard('{Tab}');
    expect(
      screen.getByRole('button', { name: 'Second panel control' }),
    ).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'First' })).toBeVisible();
  });
});
