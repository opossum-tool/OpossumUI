// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, within } from '@testing-library/react';

import { text } from '../../../../shared/text';
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

    expect(await screen.findByText('docs')).toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.queryByText('single')).not.toBeInTheDocument();
  });

  it('uses the shared single-child expansion behavior', async () => {
    await renderPicker();

    fireEvent.click(
      await screen.findByRole('button', {
        name: text.splitDialog.resourcePicker.expand('/src'),
      }),
    );

    expect(await screen.findByText('single')).toBeInTheDocument();
    expect(screen.getByText('first.ts')).toBeInTheDocument();
    expect(screen.getByText('second.ts')).toBeInTheDocument();
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

    await screen.findByText('docs');
    expect(screen.getByTestId('readonly-indicator')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', {
        name: text.splitDialog.resourcePicker.expand('/docs'),
      }),
    );
    expect(await screen.findByText('README.md')).toBeInTheDocument();
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
