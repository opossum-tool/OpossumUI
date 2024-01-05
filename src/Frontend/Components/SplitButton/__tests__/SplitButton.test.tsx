// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../testing/Faker';
import { ContextMenuItem } from '../../ContextMenu/ContextMenu';
import { SplitButton } from '../SplitButton';

function fakeMenuItem(props: Partial<ContextMenuItem> = {}): ContextMenuItem {
  return {
    onClick: jest.fn(),
    buttonText: faker.string.sample(),
    ...props,
  };
}

describe('SplitButton', () => {
  it('renders button title as first visible option', () => {
    const hiddenMenuItem = fakeMenuItem({ hidden: true });
    const visibleMenuItem = fakeMenuItem({ hidden: false });
    render(<SplitButton options={[hiddenMenuItem, visibleMenuItem]} />);

    expect(screen.getByText(visibleMenuItem.buttonText)).toBeInTheDocument();
  });

  it('fires action handler', async () => {
    const menuItem = fakeMenuItem();
    render(<SplitButton options={[menuItem]} />);

    await userEvent.click(screen.getByText(menuItem.buttonText));

    expect(menuItem.onClick).toHaveBeenCalledTimes(1);
  });

  it('selects new option', async () => {
    const menuItem1 = fakeMenuItem();
    const menuItem2 = fakeMenuItem();
    render(<SplitButton options={[menuItem1, menuItem2]} />);

    await userEvent.click(screen.getByLabelText('menu button'));
    await userEvent.click(screen.getByText(menuItem2.buttonText));

    expect(menuItem1.onClick).not.toHaveBeenCalled();
    expect(menuItem2.onClick).not.toHaveBeenCalled();
    expect(screen.getByText(menuItem2.buttonText)).toBeInTheDocument();
  });

  it('does not display hidden options', async () => {
    const visibleMenuItem1 = fakeMenuItem({ hidden: false });
    const visibleMenuItem2 = fakeMenuItem({ hidden: false });
    const hiddenMenuItem = fakeMenuItem({ hidden: true });
    render(
      <SplitButton
        options={[visibleMenuItem1, visibleMenuItem2, hiddenMenuItem]}
      />,
    );

    await userEvent.click(screen.getByLabelText('menu button'));

    expect(screen.getAllByText(visibleMenuItem1.buttonText)).toHaveLength(2);
    expect(screen.getByText(visibleMenuItem2.buttonText)).toBeInTheDocument();
    expect(
      screen.queryByText(hiddenMenuItem.buttonText),
    ).not.toBeInTheDocument();
  });

  it('does not display menu trigger when only one option available', () => {
    const visibleMenuItem = fakeMenuItem({ hidden: false });
    const hiddenMenuItem = fakeMenuItem({ hidden: true });
    render(<SplitButton options={[visibleMenuItem, hiddenMenuItem]} />);

    expect(screen.queryByLabelText('menu button')).not.toBeInTheDocument();
  });

  it('does not display action button or menu trigger at all if all options are hidden', () => {
    const menuItem = fakeMenuItem({ hidden: true });
    const { container } = render(<SplitButton options={[menuItem]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('updates selected option when options change', () => {
    const menuItem = fakeMenuItem({ hidden: true });
    const { rerender } = render(<SplitButton options={[menuItem]} />);

    rerender(<SplitButton options={[{ ...menuItem, hidden: false }]} />);

    expect(screen.getByText(menuItem.buttonText)).toBeInTheDocument();
  });
});
