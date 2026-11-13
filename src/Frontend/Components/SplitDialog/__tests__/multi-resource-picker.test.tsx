// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { expectTextVisible } from '../../../../testing/ui';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { MultiResourcePicker } from '../MultiResourcePicker';

const data = getParsedInputFileEnrichedWithTestData({
  resources: {
    docs: { 'README.md': 1 },
    src: { single: { 'first.ts': 1, 'second.ts': 1 } },
  },
});

const readonlyData = getParsedInputFileEnrichedWithTestData({
  resources: {
    docs: { 'README.md': 1 },
  },
  readonlyRules: [{ path: '/docs', readonly: true }],
});

describe('MultiResourcePicker', () => {
  it('shows top-level resources before a folder is expanded', async () => {
    await renderPicker();

    await expectTextVisible('docs', true);
    await expectTextVisible('src', true);
    await expectTextVisible('single', false);
  });

  it('uses the shared single-child expansion behavior', async () => {
    await renderPicker();

    fireEvent.click(
      await screen.findByRole('button', {
        name: text.splitDialog.resourcePicker.expand('/src'),
      }),
    );

    await expectTextVisible('single', true);
    await expectTextVisible('first.ts', true);
    await expectTextVisible('second.ts', true);
  });

  it('expands ancestors of initially selected resources', async () => {
    const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);

    await renderComponent(
      <MultiResourcePicker
        initialSelectedPaths={['/src/single/first.ts']}
        open={true}
        onSelectionChange={vi.fn()}
      />,
      { data },
    );

    await expectTextVisible('single', true);
    await expectTextVisible('first.ts', true);
    await expectTextVisible('second.ts', true);
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'center',
        behavior: 'smooth',
      }),
    );
  });

  it('normalizes selections and visually includes descendants', async () => {
    const onSelectionChange = vi.fn();
    await renderPicker(onSelectionChange);

    fireEvent.click(
      await screen.findByRole('button', {
        name: text.splitDialog.resourcePicker.expand('/src'),
      }),
    );
    const singleCheckbox = await findCheckbox('single');
    fireEvent.click(singleCheckbox);

    expect(onSelectionChange).toHaveBeenLastCalledWith(['/src/single']);

    fireEvent.click(await findCheckbox('src'));

    expect(onSelectionChange).toHaveBeenLastCalledWith(['/src']);
    expect(await findCheckbox('single')).toBeChecked();
    expect(await findCheckbox('single')).toBeDisabled();
  });

  it('disables selection changes when disabled', async () => {
    const onSelectionChange = vi.fn();
    await renderComponent(
      <MultiResourcePicker
        disabled={true}
        open={true}
        onSelectionChange={onSelectionChange}
      />,
      { data },
    );

    const docsCheckbox = await findCheckbox('docs');
    expect(docsCheckbox).toBeDisabled();

    fireEvent.click(docsCheckbox);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('replaces readonly resource checkboxes with aligned lock icons', async () => {
    await renderComponent(
      <MultiResourcePicker open={true} onSelectionChange={vi.fn()} />,
      { data: readonlyData },
    );

    await expectTextVisible('docs', true);
    expect(screen.getByTestId('readonly-indicator')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', {
        name: text.splitDialog.resourcePicker.expand('/docs'),
      }),
    );
    await expectTextVisible('README.md', true);
  });
});

async function renderPicker(onSelectionChange = vi.fn()) {
  return renderComponent(
    <MultiResourcePicker open={true} onSelectionChange={onSelectionChange} />,
    { data },
  );
}

async function findCheckbox(resourceLabel: string) {
  const resource = await screen.findByText(resourceLabel);
  if (!resource.parentElement) {
    throw new Error(`Could not find row for '${resourceLabel}'`);
  }
  return within(resource.parentElement).getByRole('checkbox');
}
