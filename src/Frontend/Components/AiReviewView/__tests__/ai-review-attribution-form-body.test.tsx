// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { renderComponent } from '../../../test-helpers/render';
import { AiReviewAttributionFormBody } from '../ai-review-attribution-form-body';

describe('AiReviewAttributionFormBody', () => {
  it('keeps the whole editor open during an outside press and closes it together on release', async () => {
    const onUpdate = vi.fn();
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={faker.opossum.packageInfo({ packageType: 'npm' })}
        onUpdate={onUpdate}
        onEdit={vi.fn((confirm: () => unknown) =>
          Promise.resolve(confirm()).then(() => true),
        )}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageType}`,
      }),
    );
    const input = screen.getByRole('combobox');
    await user.clear(input);
    await user.type(input, 'cargo');
    const label = screen.getByText(text.attributionColumn.packageType, {
      selector: 'label',
    });
    const backdrop = screen.getByTestId('attribution-field-editor-backdrop');

    await user.pointer({ target: backdrop, keys: '[MouseLeft>]' });
    expect(input).toBeVisible();
    expect(label).toBeVisible();
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(onUpdate).not.toHaveBeenCalled();

    await user.pointer({ target: backdrop, keys: '[/MouseLeft]' });
    expect(input).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(label).not.toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({ packageType: 'cargo' });
  });

  it('keeps the input focused and suggestions open when clicking the editor heading', async () => {
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={faker.opossum.packageInfo({ packageType: 'npm' })}
        onUpdate={vi.fn()}
        onEdit={vi.fn((confirm: () => unknown) =>
          Promise.resolve(confirm()).then(() => true),
        )}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageType}`,
      }),
    );
    const input = screen.getByRole('combobox');
    expect(screen.getByRole('listbox')).toBeVisible();

    await userEvent.click(
      screen.getByText(text.attributionColumn.packageType, {
        selector: 'label',
      }),
    );
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeVisible();
  });

  it.each(['mouse', 'keyboard'])(
    'focuses the editor and restores focus only for %s activation',
    async (activation) => {
      await renderComponent(
        <AiReviewAttributionFormBody
          packageInfo={faker.opossum.packageInfo({ packageName: 'original' })}
          onUpdate={vi.fn()}
          onEdit={vi.fn((confirm: () => unknown) =>
            Promise.resolve(confirm()).then(() => true),
          )}
        />,
      );
      const trigger = screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageName}`,
      });
      if (activation === 'mouse') {
        await userEvent.click(trigger);
      } else {
        trigger.focus();
        await userEvent.keyboard('{Enter}');
      }
      const input = screen.getByRole('combobox');
      expect(input).toHaveFocus();
      await userEvent.keyboard(' typed');
      expect(input).toHaveValue('original typed');
      await userEvent.keyboard('{Escape}');
      expect(input).not.toBeInTheDocument();
      expect(trigger.matches(':focus')).toBe(activation === 'keyboard');
      expect(trigger.classList.contains('Mui-focusVisible')).toBe(
        activation === 'keyboard',
      );
    },
  );

  it('opens suggestions on the first click and applies a keyboard selection', async () => {
    const onUpdate = vi.fn();
    const onEdit = vi.fn((confirm: () => unknown) =>
      Promise.resolve(confirm()).then(() => true),
    );
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={faker.opossum.packageInfo({ packageType: 'npm' })}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageType}`,
      }),
    );
    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeVisible();
    await userEvent.clear(input);
    await userEvent.type(input, 'cargo');
    expect(input).toHaveValue('cargo');
    expect(screen.getByRole('listbox')).toHaveTextContent('cargo');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith({ packageType: 'cargo' });
    expect(input).not.toBeInTheDocument();
  });

  it('renders package fields in order with neutral metadata', async () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: 'A package',
      packageNamespace: 'a namespace',
      packageVersion: '2.0',
      packageType: 'npm',
      url: 'https://example.org/repository',
      comment: 'Reviewed from the manifest.',
    });
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={vi.fn()}
      />,
    );

    const table = within(screen.getByRole('table', { name: 'package fields' }));
    const rows = table.getAllByRole('row').slice(1);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[2].textContent),
    ).toEqual([
      text.attributionColumn.packageName,
      text.attributionColumn.packageNamespace,
      text.attributionColumn.packageVersion,
      text.attributionColumn.packageType,
      'Repository URL',
    ]);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[3].textContent),
    ).toEqual([
      'A package',
      'a namespace',
      '2.0',
      'npm',
      'https://example.org/repository',
    ]);
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[1].textContent),
    ).toEqual(['—', '—', '—', '—', '—']);
    expect(screen.getByText('Reviewed from the manifest.')).toBeVisible();
    expect(
      screen.queryByRole('textbox', { name: 'Comment' }),
    ).not.toBeInTheDocument();
  });

  it('expands by keyboard and mouse, preserves multiline values, and hides first-party legal fields', async () => {
    const copyright = 'Copyright line one\nCopyright line two';
    const packageInfo = faker.opossum.packageInfo({
      firstParty: false,
      copyright,
      licenseName: 'MIT',
    });
    const { rerender } = await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={vi.fn()}
      />,
    );

    const legalTable = within(
      screen.getByRole('table', { name: 'legal fields' }),
    );
    expect(legalTable.getByText('Attribution type')).toBeVisible();
    expect(legalTable.getByText(text.diffPopup.copyright)).toBeVisible();
    expect(
      legalTable.getByText(text.attributionColumn.licenseExpression),
    ).toBeVisible();
    const expandButton = screen.getByRole('button', {
      name: 'Expand Copyright',
    });
    expandButton.focus();
    await userEvent.keyboard('{Enter}');
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText(/Copyright line one/)).toHaveLength(2);
    expect(screen.getAllByText(/Copyright line one/)[1].textContent).toBe(
      copyright,
    );
    const licenseExpandButton = screen.getByRole('button', {
      name: `Expand ${text.attributionColumn.licenseExpression}`,
    });
    await userEvent.click(licenseExpandButton);
    expect(licenseExpandButton).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <AiReviewAttributionFormBody
        packageInfo={{
          ...packageInfo,
          id: faker.string.uuid(),
          firstParty: true,
        }}
        onUpdate={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(text.diffPopup.copyright),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(text.attributionColumn.licenseExpression),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Attribution type')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Expand Attribution type' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts package-name editing without toggling the row and sends changes through confirmation', async () => {
    const packageInfo = faker.opossum.packageInfo({ packageName: 'before' });
    const onUpdate = vi.fn();
    const onEdit = vi.fn((confirm: () => unknown) =>
      Promise.resolve(confirm()).then(() => true),
    );
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );

    const packageNameRow = within(
      screen.getByRole('table', { name: 'package fields' }),
    ).getAllByRole('row')[1];
    await userEvent.click(screen.getByText('before'));
    expect(screen.getByRole('combobox')).toHaveValue('before');
    expect(screen.getByRole('combobox')).toHaveFocus();
    expect(
      within(packageNameRow).getByRole('button', {
        name: /Expand Component Name/,
        hidden: true,
      }),
    ).toHaveAttribute('aria-expanded', 'false');

    await userEvent.clear(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'after');
    expect(onUpdate).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith({ packageName: 'after' });
  });

  it('cancels package-name edits with Escape', async () => {
    const packageInfo = faker.opossum.packageInfo({ packageName: 'original' });
    const onUpdate = vi.fn();
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        onEdit={vi.fn((confirm: () => unknown) =>
          Promise.resolve(confirm()).then(() => true),
        )}
      />,
    );

    await userEvent.click(screen.getByText('original'));
    const editor = screen.getByRole('combobox');
    await userEvent.clear(editor);
    await userEvent.type(editor, 'discarded');
    await userEvent.keyboard('{Escape}');
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getAllByText('original')[0]).toBeVisible();
  });

  it('discards the editing session when switching attributions', async () => {
    const packageInfo = faker.opossum.packageInfo({ packageName: 'original' });
    const onUpdate = vi.fn();
    const onEdit = vi.fn((confirm: () => unknown) =>
      Promise.resolve(confirm()).then(() => true),
    );
    const { rerender } = await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageName}`,
      }),
    );
    await userEvent.clear(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'discarded');

    rerender(
      <AiReviewAttributionFormBody
        packageInfo={{
          ...packageInfo,
          id: faker.string.uuid(),
          packageName: 'next package',
        }}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );
    expect(
      screen.queryByRole('combobox', {
        name: text.attributionColumn.packageName,
      }),
    ).not.toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageName}`,
      }),
    );
    expect(screen.getByRole('combobox')).toHaveValue('next package');
  });

  it('edits an expanded value and displays the updated draft in both views', async () => {
    const packageInfo = faker.opossum.packageInfo({ packageName: 'before' });
    const onUpdate = vi.fn();
    const onEdit = vi.fn((confirm: () => unknown) =>
      Promise.resolve(confirm()).then(() => true),
    );
    const { rerender } = await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: `Expand ${text.attributionColumn.packageName}`,
      }),
    );
    const editButtons = screen.getAllByRole('button', {
      name: `Edit ${text.attributionColumn.packageName}`,
    });
    expect(editButtons).toHaveLength(2);
    await userEvent.click(editButtons[1]);
    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('before');
    await userEvent.clear(input);
    await userEvent.type(input, 'after');
    await userEvent.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onUpdate).toHaveBeenCalledWith({ packageName: 'after' });

    rerender(
      <AiReviewAttributionFormBody
        packageInfo={{ ...packageInfo, packageName: 'after' }}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );
    expect(
      screen
        .getAllByRole('button', {
          name: `Edit ${text.attributionColumn.packageName}`,
        })
        .map((button) => button.textContent),
    ).toEqual(['after', 'after']);
    expect(
      screen.getByRole('button', {
        name: `Collapse ${text.attributionColumn.packageName}`,
      }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('ignores a late edit confirmation after switching attributions', async () => {
    const packageInfo = faker.opossum.packageInfo({ packageName: 'before' });
    const onUpdate = vi.fn();
    const onEdit = vi.fn((_confirm: () => unknown) => Promise.resolve(false));
    const { rerender } = await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={packageInfo}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageName}`,
      }),
    );
    await userEvent.clear(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'after');
    await userEvent.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledOnce();

    rerender(
      <AiReviewAttributionFormBody
        packageInfo={{
          ...packageInfo,
          id: faker.string.uuid(),
          packageName: 'next',
        }}
        onUpdate={onUpdate}
        onEdit={onEdit}
      />,
    );
    await onEdit.mock.calls[0][0]();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText('next')).toBeVisible();
  });

  it('applies a suggestion by mouse without toggling the table row', async () => {
    const onUpdate = vi.fn();
    await renderComponent(
      <AiReviewAttributionFormBody
        packageInfo={faker.opossum.packageInfo({ packageType: 'npm' })}
        onUpdate={onUpdate}
        onEdit={vi.fn((confirm: () => unknown) =>
          Promise.resolve(confirm()).then(() => true),
        )}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: `Edit ${text.attributionColumn.packageType}`,
      }),
    );
    await userEvent.clear(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'cargo');
    await userEvent.click(await screen.findByRole('option', { name: /cargo/ }));
    expect(onUpdate).toHaveBeenCalledWith({ packageType: 'cargo' });
    expect(
      screen.queryByRole('combobox', {
        name: text.attributionColumn.packageType,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `Expand ${text.attributionColumn.packageType}`,
      }),
    ).toHaveAttribute('aria-expanded', 'false');
  });
});
