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
