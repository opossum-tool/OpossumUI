// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { Criticality, type PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { theme } from '../../App/App.style';
import type { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { ComparisonFieldEditor } from '../ComparisonFieldEditor';
import { ComparisonRows } from '../ComparisonRows';
import type { ComparisonItem } from '../DiffPopup';
import type { FieldDefinition } from '../DiffPopup.util';

function packageInfo(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return {
    id: 'package',
    criticality: Criticality.None,
    packageName: 'package',
    packageType: 'npm',
    comment: 'opening comment',
    ...overrides,
  };
}

function item(overrides: Partial<ComparisonItem> = {}): ComparisonItem {
  return {
    isExternal: false,
    label: 'item',
    packageInfo: packageInfo(),
    ...overrides,
  };
}

const commentField: FieldDefinition = {
  key: 'comment',
  label: text.diffPopup.comment,
  multiline: true,
  rows: 5,
};
const typeField: FieldDefinition = {
  key: 'firstParty',
  label: text.diffPopup.attributionType,
};
const defaults = { left: {}, right: {} };
const confirm: Confirm = (onConfirm) => {
  void onConfirm();
  return Promise.resolve(true);
};
const editConfirmations = { left: confirm, right: confirm };

function renderEditor(
  props: Partial<React.ComponentProps<typeof ComparisonFieldEditor>> = {},
) {
  const onChange = vi.fn();
  const onUndo = vi.fn();
  return {
    onChange,
    onUndo,
    ...render(
      <ThemeProvider theme={theme}>
        <ComparisonFieldEditor
          side={'right'}
          item={item()}
          field={commentField}
          draft={packageInfo()}
          openingPackageInfo={packageInfo()}
          isBusy={false}
          onChange={onChange}
          onUndo={onUndo}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          onEdit={props.onEdit ?? confirm}
          {...props}
        />
      </ThemeProvider>,
    ),
  };
}

describe('ComparisonFieldEditor', () => {
  it('normalizes an undefined attribution type to third party', () => {
    renderEditor({ field: typeField });

    expect(
      screen.getByRole('button', { name: text.filters.thirdParty }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes attribution type after confirmation and ignores the selected type', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn((onConfirm: () => unknown) => {
      void onConfirm();
      return Promise.resolve(true);
    });
    const { onChange } = renderEditor({
      field: typeField,
      draft: packageInfo({ firstParty: false }),
      onEdit,
    });

    await user.click(
      screen.getByRole('button', { name: text.filters.thirdParty }),
    );
    await user.click(
      screen.getByRole('button', { name: text.filters.firstParty }),
    );

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('right', {
      firstParty: true,
    });
  });

  it('does not change attribution type when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onEdit = vi.fn(() => Promise.resolve(false));
    renderEditor({
      field: typeField,
      draft: packageInfo({ firstParty: false }),
      onChange,
      onEdit,
    });

    await user.click(
      screen.getByRole('button', { name: text.filters.firstParty }),
    );

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables attribution type changes for read-only and busy comparisons', () => {
    const { rerender } = renderEditor({
      field: typeField,
      item: item({ isExternal: true }),
    });
    expect(
      screen.getByRole('button', { name: text.filters.firstParty }),
    ).toBeDisabled();

    rerender(
      <ThemeProvider theme={theme}>
        <ComparisonFieldEditor
          side={'right'}
          item={item()}
          field={typeField}
          draft={packageInfo()}
          openingPackageInfo={packageInfo()}
          isBusy={true}
          onChange={vi.fn()}
          onUndo={vi.fn()}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          onEdit={confirm}
        />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole('button', { name: text.filters.firstParty }),
    ).toBeDisabled();
  });

  it('renders read-only and busy fields without allowing changes', () => {
    const { rerender } = renderEditor({ item: item({ isExternal: true }) });
    expect(screen.getByTestId('right-comment')).toHaveAttribute('readonly');
    rerender(
      <ThemeProvider theme={theme}>
        <ComparisonFieldEditor
          side={'right'}
          item={item()}
          field={commentField}
          draft={packageInfo()}
          openingPackageInfo={packageInfo()}
          isBusy={true}
          onChange={vi.fn()}
          onUndo={vi.fn()}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          onEdit={confirm}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('right-comment')).toBeDisabled();
  });

  it('reports validation and sends a single field patch', () => {
    const { onChange } = renderEditor({ draft: packageInfo({ comment: '' }) });
    expect(screen.getByTestId('validation-display')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('right-comment'), {
      target: { value: 'edited' },
    });
    expect(onChange).toHaveBeenCalledWith('right', { comment: 'edited' });
  });

  it('confirms a text edit before applying its captured value', () => {
    const onEdit: Confirm = (onConfirm) => {
      void onConfirm();
      return Promise.resolve(true);
    };
    const { onChange } = renderEditor({ onEdit });

    fireEvent.change(screen.getByTestId('right-comment'), {
      target: { value: 'confirmed edit' },
    });

    expect(onChange).toHaveBeenCalledWith('right', {
      comment: 'confirmed edit',
    });
  });

  it('shows undo only after a value changes and restores attribution type labels', async () => {
    const user = userEvent.setup();
    const { onUndo, rerender } = renderEditor({
      draft: packageInfo({ comment: 'changed' }),
    });
    const undo = screen.getByRole('button', {
      name: text.diffPopup.undoField(text.diffPopup.comment, 'item'),
    });
    await user.click(undo);
    expect(onUndo).toHaveBeenCalledWith('right', 'comment');
    rerender(
      <ThemeProvider theme={theme}>
        <ComparisonFieldEditor
          side={'right'}
          item={item()}
          field={typeField}
          draft={packageInfo({ firstParty: true })}
          openingPackageInfo={packageInfo({ firstParty: undefined })}
          isBusy={false}
          onChange={vi.fn()}
          onUndo={onUndo}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          onEdit={confirm}
        />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole('button', {
        name: text.diffPopup.restoreField(text.filters.thirdParty, 'item'),
      }),
    ).toBeInTheDocument();
  });
});

describe('ComparisonRows', () => {
  function renderRows(
    left: PackageInfo,
    right: PackageInfo,
    onCopy: ComponentProps<typeof ComparisonRows>['onCopy'],
    options: { isBusy?: boolean; rightItem?: ComparisonItem } = {},
  ) {
    render(
      <ThemeProvider theme={theme}>
        <ComparisonRows
          fields={[commentField]}
          left={item({ packageInfo: left })}
          right={options.rightItem ?? item({ packageInfo: right })}
          drafts={{ left, right }}
          isBusy={options.isBusy ?? false}
          onChange={vi.fn()}
          onCopy={onCopy}
          onUndo={vi.fn()}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          editConfirmations={editConfirmations}
        />
      </ThemeProvider>,
    );
  }

  it('calls copy with the direction selected by each control', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderRows(
      packageInfo({ comment: 'left' }),
      packageInfo({ comment: 'right' }),
      onCopy,
    );
    await user.click(
      screen.getByRole('button', {
        name: `${text.diffPopup.copyLeftToRight}: ${text.diffPopup.comment}`,
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: `${text.diffPopup.copyRightToLeft}: ${text.diffPopup.comment}`,
      }),
    );
    expect(onCopy).toHaveBeenNthCalledWith(1, 'left', 'right', 'comment');
    expect(onCopy).toHaveBeenNthCalledWith(2, 'right', 'left', 'comment');
  });

  it('hides transfers for busy, read-only, and first-party-comment cases', () => {
    const left = packageInfo({ comment: 'left' });
    const right = packageInfo({ comment: 'right' });
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <ComparisonRows
          fields={[commentField]}
          left={item({ packageInfo: left })}
          right={item({ packageInfo: right })}
          drafts={{ left, right }}
          isBusy={true}
          onChange={vi.fn()}
          onCopy={vi.fn()}
          onUndo={vi.fn()}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          editConfirmations={editConfirmations}
        />
      </ThemeProvider>,
    );
    expect(
      screen.queryByRole('button', { name: /Transfer from/ }),
    ).not.toBeInTheDocument();
    rerender(
      <ThemeProvider theme={theme}>
        <ComparisonRows
          fields={[commentField]}
          left={item({ packageInfo: { ...left, firstParty: true } })}
          right={item({ packageInfo: right })}
          drafts={{ left: { ...left, firstParty: true }, right }}
          isBusy={false}
          onChange={vi.fn()}
          onCopy={vi.fn()}
          onUndo={vi.fn()}
          showLicenseText={false}
          onToggleLicenseText={vi.fn()}
          packageDefaults={defaults}
          editConfirmations={editConfirmations}
        />
      </ThemeProvider>,
    );
    expect(
      screen.queryByRole('button', { name: /Transfer from/ }),
    ).not.toBeInTheDocument();
  });
});
