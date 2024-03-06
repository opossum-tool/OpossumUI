// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { SelectMenu, SelectMenuOption } from '../SelectMenu';

function createOption(props: Partial<SelectMenuOption> = {}): SelectMenuOption {
  return {
    id: faker.string.uuid(),
    label: faker.company.name(),
    selected: false,
    ...props,
  };
}

describe('SelectMenu', () => {
  it('displays selected option in single mode', () => {
    const anchorEl = document.createElement('div');
    const setAnchorEl = jest.fn();
    const option1 = createOption();
    const option2 = createOption({ selected: true });
    renderComponent(
      <SelectMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        options={[option1, option2]}
      />,
    );

    expect(
      within(
        screen.getByRole('menuitem', { name: option1.label!.toString() }),
      ).getByTestId('CheckIcon'),
    ).not.toBeVisible();
    expect(
      within(
        screen.getByRole('menuitem', { name: option2.label!.toString() }),
      ).getByTestId('CheckIcon'),
    ).toBeVisible();
  });

  it('selects new option in single mode', async () => {
    const anchorEl = document.createElement('div');
    const setAnchorEl = jest.fn();
    const onAdd = jest.fn();
    const onDelete = jest.fn();
    const option1 = createOption({ onAdd });
    const option2 = createOption({ selected: true, onDelete });
    renderComponent(
      <SelectMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        options={[option1, option2]}
      />,
    );

    await userEvent.click(
      screen.getByRole('menuitem', { name: option1.label!.toString() }),
    );

    expect(setAnchorEl).toHaveBeenCalledTimes(1);
    expect(setAnchorEl).toHaveBeenCalledWith(undefined);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('displays selected options in multiple mode', () => {
    const anchorEl = document.createElement('div');
    const setAnchorEl = jest.fn();
    const option1 = createOption();
    const option2 = createOption({ selected: true });
    renderComponent(
      <SelectMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        options={[option1, option2]}
        multiple
      />,
    );

    expect(
      within(
        screen.getByRole('menuitem', { name: option1.label!.toString() }),
      ).getByTestId('CheckIcon'),
    ).not.toBeVisible();
    expect(
      within(
        screen.getByRole('menuitem', { name: option2.label!.toString() }),
      ).getByTestId('CheckIcon'),
    ).toBeVisible();
  });

  it('selects new option in multiple mode', async () => {
    const anchorEl = document.createElement('div');
    const setAnchorEl = jest.fn();
    const onAdd = jest.fn();
    const onDelete = jest.fn();
    const option1 = createOption({ onAdd });
    const option2 = createOption({ selected: true, onDelete });
    renderComponent(
      <SelectMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        options={[option1, option2]}
        multiple
      />,
    );

    await userEvent.click(
      screen.getByRole('menuitem', { name: option1.label!.toString() }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: option2.label!.toString() }),
    );

    expect(setAnchorEl).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(setAnchorEl).toHaveBeenCalledWith(undefined);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not display selected options in multiple mode when selected are hidden', () => {
    const anchorEl = document.createElement('div');
    const setAnchorEl = jest.fn();
    const option1 = createOption();
    const option2 = createOption({ selected: true });
    renderComponent(
      <SelectMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        options={[option1, option2]}
        multiple
        hideSelected
      />,
    );

    expect(
      within(
        screen.getByRole('menuitem', { name: option1.label!.toString() }),
      ).getByTestId('CheckIcon'),
    ).not.toBeVisible();
    expect(
      screen.queryByRole('menuitem', { name: option2.label!.toString() }),
    ).not.toBeInTheDocument();
  });

  it('selects new option in multiple mode when selected are hidden', async () => {
    const anchorEl = document.createElement('div');
    const setAnchorEl = jest.fn();
    const onAdd = jest.fn();
    const onDelete = jest.fn();
    const option1 = createOption({ onAdd });
    const option2 = createOption({ selected: true, onDelete });
    renderComponent(
      <SelectMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        options={[option1, option2]}
        multiple
        hideSelected
      />,
    );

    await userEvent.click(
      screen.getByRole('menuitem', { name: option1.label!.toString() }),
    );

    expect(setAnchorEl).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');

    expect(setAnchorEl).toHaveBeenCalledWith(undefined);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
