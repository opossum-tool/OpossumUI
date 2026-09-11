// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { useConfirmAttributionEdit } from '../use-confirm-attribution-edit';

function TestComponent({
  packageInfo,
  onEdit,
}: {
  packageInfo: PackageInfo;
  onEdit: () => void;
}) {
  const { confirm, dialog, isOpen } = useConfirmAttributionEdit(packageInfo);

  return (
    <>
      <button onClick={() => void confirm(onEdit)}>Edit</button>
      <output>{String(isOpen)}</output>
      {dialog}
    </>
  );
}

describe('useConfirmAttributionEdit', () => {
  it('runs edits without a dialog when no warning is required', async () => {
    const onEdit = vi.fn();
    await renderComponent(
      <TestComponent
        packageInfo={faker.opossum.packageInfo()}
        onEdit={onEdit}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(
      screen.queryByLabelText('confirmation dialog'),
    ).not.toBeInTheDocument();
  });

  it('waits for confirmation before editing a previously preferred attribution', async () => {
    const original = faker.opossum.packageInfo();
    const draft = {
      ...original,
      id: faker.string.uuid(),
      originalAttributionId: original.id,
      originalAttributionWasPreferred: true,
    };
    const onEdit = vi.fn();
    await renderComponent(
      <TestComponent packageInfo={draft} onEdit={onEdit} />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          externalAttributions: { [original.id]: original },
        }),
      },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(
      await screen.findByLabelText('confirmation dialog'),
    ).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('true')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );

    expect(onEdit).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByLabelText('confirmation dialog'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('false')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.ok }),
    );

    expect(onEdit).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(
        screen.queryByLabelText('confirmation dialog'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('false')).toBeInTheDocument();
  });
});
