// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import {
  clickPopupButton,
  CONFIRMATION_DIALOG_LABEL,
  expectPopupVisibility,
  expectTextVisible,
} from '../../../../testing/ui';
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
    await expectPopupVisibility(CONFIRMATION_DIALOG_LABEL, false);
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

    await expectPopupVisibility(CONFIRMATION_DIALOG_LABEL, true);
    expect(onEdit).not.toHaveBeenCalled();
    await expectTextVisible('true', true);

    await clickPopupButton(CONFIRMATION_DIALOG_LABEL, text.buttons.cancel);

    expect(onEdit).not.toHaveBeenCalled();
    await expectPopupVisibility(CONFIRMATION_DIALOG_LABEL, false);
    await expectTextVisible('false', true);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await clickPopupButton(CONFIRMATION_DIALOG_LABEL, text.buttons.ok);

    expect(onEdit).toHaveBeenCalledOnce();
    await expectPopupVisibility(CONFIRMATION_DIALOG_LABEL, false);
    await expectTextVisible('false', true);
  });
});
