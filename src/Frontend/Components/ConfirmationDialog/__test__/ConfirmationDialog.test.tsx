// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import {
  ConfirmationDialog,
  ConfirmOptions,
  useConfirmationDialog,
} from '../ConfirmationDialog';

const TestComponent: React.FC<
  ConfirmOptions & {
    onConfirm?: () => unknown | Promise<unknown>;
    title?: string;
    message?: string;
    buttonTitle?: string;
  }
> = ({
  onCancel,
  onConfirm = jest.fn(),
  skip,
  buttonTitle = faker.string.sample(),
  message = faker.lorem.paragraph(),
  title = faker.lorem.sentence(),
}) => {
  const [ref, confirm] = useConfirmationDialog();

  return (
    <>
      <button onClick={() => confirm(onConfirm, { onCancel, skip })}>
        {buttonTitle}
      </button>
      <ConfirmationDialog ref={ref} title={title} message={message} />
    </>
  );
};

describe('ConfirmationDialog', () => {
  it('shows confirmation dialog when confirmation is required', async () => {
    renderComponent(<TestComponent />);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByLabelText('confirmation dialog')).toBeInTheDocument();
  });

  it('does not show confirmation dialog and calls confirm handler immediately when no confirmation is required', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderComponent(
      <TestComponent skip={true} onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText('confirmation dialog'),
    ).not.toBeInTheDocument();
  });

  it('closes confirmation dialog and calls confirm handler when user confirms confirmation dialog', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderComponent(
      <TestComponent onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.ok }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByLabelText('confirmation dialog'),
      ).not.toBeInTheDocument(),
    );
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('closes confirmation dialog and calls cancel handler when user cancels out of confirmation dialog', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    renderComponent(
      <TestComponent onConfirm={onConfirm} onCancel={onCancel} />,
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByLabelText('confirmation dialog'),
      ).not.toBeInTheDocument(),
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
