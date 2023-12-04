// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../shared/Faker';
import { ContextMenuItem } from '../../ContextMenu/ContextMenu';
import { MenuButton } from '../MenuButton';

function fakeMenuItem(props: Partial<ContextMenuItem> = {}): ContextMenuItem {
  return {
    onClick: jest.fn(),
    buttonText: faker.lorem.word(),
    ...props,
  };
}

describe('MenuButton', () => {
  it('renders button title', () => {
    const title = faker.lorem.word();
    render(<MenuButton title={title} options={[fakeMenuItem()]} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('selects option', async () => {
    const menuItem = fakeMenuItem();
    render(<MenuButton title={faker.lorem.word()} options={[menuItem]} />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText(menuItem.buttonText));

    expect(menuItem.onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(menuItem.buttonText)).not.toBeInTheDocument();
  });

  it('does not display hidden options', async () => {
    const visibleMenuItem = fakeMenuItem({ hidden: false });
    const hiddenMenuItem = fakeMenuItem({ hidden: true });
    render(
      <MenuButton
        title={faker.lorem.word()}
        options={[visibleMenuItem, hiddenMenuItem]}
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText(visibleMenuItem.buttonText)).toBeInTheDocument();
    expect(
      screen.queryByText(hiddenMenuItem.buttonText),
    ).not.toBeInTheDocument();
  });

  it('does not display menu trigger at all if all options are hidden', () => {
    const menuItem = fakeMenuItem({ hidden: true });
    const { container } = render(
      <MenuButton title={faker.lorem.word()} options={[menuItem]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
