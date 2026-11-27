// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import type {
  PackageInfo,
  ParsedFileContent,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import type { AttributionFormBodyProps } from '../../AttributionForm/attribution-form.types';
import { AiReviewAttributionFormBody } from '../ai-review-attribution-form-body';

function EditableForm({
  packageInfo,
  onUpdate,
  onEdit,
}: AttributionFormBodyProps) {
  const [draft, setDraft] = useState(packageInfo);
  return (
    <AiReviewAttributionFormBody
      packageInfo={draft}
      onEdit={onEdit}
      onUpdate={(patch) => {
        onUpdate(patch);
        setDraft((current) => ({ ...current, ...patch }));
      }}
    />
  );
}

async function renderForm(
  overrides: Partial<PackageInfo>,
  data?: ParsedFileContent,
) {
  const packageInfo = faker.opossum.packageInfo({
    firstParty: false,
    ...overrides,
  });
  const onUpdate = vi.fn();
  const onEdit = vi.fn((confirm: () => unknown) =>
    Promise.resolve(confirm()).then(() => true),
  );
  await renderComponent(
    <EditableForm
      packageInfo={packageInfo}
      onUpdate={onUpdate}
      onEdit={onEdit}
    />,
    { data },
  );
  return { onUpdate, onEdit };
}

const licenseData = getParsedInputFileEnrichedWithTestData({
  frequentLicenses: {
    nameOrder: [
      { shortName: 'MIT', fullName: 'MIT License' },
      { shortName: 'Apache-2.0', fullName: 'Apache License 2.0' },
    ],
    texts: {},
  },
});

describe('AI Review field editing', () => {
  it('switches attribution type without deleting hidden legal values', async () => {
    const { onUpdate, onEdit } = await renderForm({
      copyright: 'Original copyright',
      licenseName: 'MIT',
    });
    expect(screen.getByRole('button', { name: 'Third Party' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'First Party' }));
    expect(onUpdate).toHaveBeenLastCalledWith({ firstParty: true });
    expect(
      screen.queryByRole('button', { name: 'Edit Copyright' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: `Edit ${text.attributionColumn.licenseExpression}`,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId('attribution-field-editor-backdrop'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Expand Attribution type' }),
    ).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Third Party' }));
    expect(onUpdate).toHaveBeenLastCalledWith({ firstParty: false });
    expect(onEdit).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('button', { name: 'Edit Copyright' }),
    ).toHaveTextContent('Original copyright');
    expect(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.licenseExpression}`,
      }),
    ).toHaveTextContent('MIT');
    await userEvent.click(
      screen.getByRole('button', { name: 'Expand Attribution type' }),
    );
    const details = within(
      screen.getByRole('row', { name: /Full Value Attribution type/ }),
    );
    expect(
      details.getByRole('button', { name: 'Third Party' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(details.getByRole('button', { name: 'First Party' }));
    expect(onUpdate).toHaveBeenLastCalledWith({ firstParty: true });
    screen.getAllByRole('button', { name: 'First Party' }).forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('edits the comment within its card and applies it when leaving the field', async () => {
    const { onUpdate, onEdit } = await renderForm({
      comment: 'Original comment',
    });
    const comment = within(screen.getByRole('region', { name: 'Comment' }));
    await userEvent.click(
      comment.getByRole('button', { name: 'Edit Comment' }),
    );
    const input = comment.getByRole('textbox', { name: 'Comment' });
    expect(input).toHaveFocus();
    expect(
      screen.queryByTestId('attribution-field-editor-backdrop'),
    ).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'Inline review');
    await userEvent.click(screen.getByRole('heading', { name: 'Package' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith({ comment: 'Inline review' });
    expect(comment.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      comment.getByRole('button', { name: 'Edit Comment' }),
    ).toHaveTextContent('Inline review');
  });

  it('lets keyboard users tab out of the inline comment without moving focus back', async () => {
    const onUpdate = vi.fn();
    await renderComponent(
      <>
        <EditableForm
          packageInfo={faker.opossum.packageInfo({
            comment: 'Original comment',
          })}
          onUpdate={onUpdate}
          onEdit={(confirm) => Promise.resolve(confirm()).then(() => true)}
        />
        <button>Next control</button>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Edit Comment' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Comment' }),
      ' changed',
    );
    await userEvent.tab();
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith({
      comment: 'Original comment changed',
    });
    expect(screen.getByRole('button', { name: 'Next control' })).toHaveFocus();
    expect(
      screen.queryByRole('textbox', { name: 'Comment' }),
    ).not.toBeInTheDocument();
  });

  it('returns keyboard focus to the comment after cancelling an inline edit', async () => {
    const { onUpdate } = await renderForm({ comment: 'Original comment' });
    screen.getByRole('button', { name: 'Edit Comment' }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Comment' }),
      ' discarded',
    );
    await userEvent.keyboard('{Escape}');
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit Comment' })).toHaveFocus();
  });

  it.each([
    ['copyright', 'Copyright'],
    ['comment', 'Comment'],
  ] as const)(
    'edits multiline %s without committing on a newline',
    async (attribute, label) => {
      const { onUpdate, onEdit } = await renderForm({
        [attribute]: 'original',
      });
      if (attribute === 'copyright') {
        await userEvent.click(
          screen.getByRole('button', { name: 'Expand Copyright' }),
        );
      }
      const buttons = screen.getAllByRole('button', { name: `Edit ${label}` });
      await userEvent.click(buttons[buttons.length - 1]);
      const input = screen.getByRole('textbox', { name: label });
      expect(input).toHaveFocus();
      await userEvent.clear(input);
      await userEvent.type(input, 'first line{Enter}second line');
      expect(input).toHaveValue('first line\nsecond line');
      expect(onUpdate).not.toHaveBeenCalled();
      await userEvent.keyboard('{Control>}{Enter}{/Control}');
      expect(onEdit).toHaveBeenCalledOnce();
      expect(onUpdate).toHaveBeenCalledWith({
        [attribute]: 'first line\nsecond line',
      });
      expect(
        screen.queryByRole('textbox', { name: label }),
      ).not.toBeInTheDocument();
      screen
        .getAllByRole('button', { name: `Edit ${label}` })
        .forEach((button) => {
          expect(button.textContent).toBe('first line\nsecond line');
        });
    },
  );

  it.each([
    ['copyright', 'Copyright'],
    ['comment', 'Comment'],
  ] as const)('cancels %s changes with Escape', async (attribute, label) => {
    const { onUpdate, onEdit } = await renderForm({ [attribute]: 'original' });
    await userEvent.click(
      screen.getByRole('button', { name: `Edit ${label}` }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: label }),
      ' discarded',
    );
    await userEvent.keyboard('{Escape}');
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: `Edit ${label}` }),
    ).toHaveTextContent('original');
  });

  it('uses SPDX autocomplete and clears custom license text when selecting a license', async () => {
    const { onUpdate, onEdit } = await renderForm(
      { licenseName: 'MIT', licenseText: 'custom text' },
      licenseData,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.licenseExpression}`,
      }),
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, 'MIT AND A');
    await userEvent.click(
      await screen.findByRole('option', { name: /Apache-2.0/ }),
    );
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith({
      licenseName: 'MIT AND Apache-2.0',
      licenseText: '',
    });
    expect(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.licenseExpression}`,
      }),
    ).toHaveTextContent('MIT AND Apache-2.0');
  });

  it('preserves custom license text when typing and applying an SPDX fix', async () => {
    const { onUpdate, onEdit } = await renderForm(
      { licenseName: 'MIT', licenseText: 'custom text' },
      licenseData,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.licenseExpression}`,
      }),
    );
    const input = screen.getByRole('combobox');
    await userEvent.clear(input);
    await userEvent.type(input, 'MIT and Apache-2.0');
    await userEvent.click(await screen.findByText('capitalized'));
    expect(input).toHaveValue('MIT AND Apache-2.0');
    expect(onUpdate).not.toHaveBeenCalled();
    await userEvent.keyboard('{Tab}');
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith({
      licenseName: 'MIT AND Apache-2.0',
    });
  });

  it('keeps all values read-only without an edit callback', async () => {
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={faker.opossum.packageInfo({ firstParty: false })}
        onUpdate={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /^Edit / }),
    ).not.toBeInTheDocument();
  });
});
