// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Criticality,
  type PackageInfo,
} from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { renderComponent } from '../../../../test-helpers/render';
import { PurlField } from '../PackageFields';

const toaster = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const textBox = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock('../../../Toaster', () => ({ toast: toaster }));
vi.mock('../../../TextBox/TextBox', () => ({
  TextBox: ({
    text,
    disabled,
    endIcon,
  }: {
    text?: string;
    disabled?: boolean;
    endIcon?: React.ReactNode;
  }) => {
    textBox.render({ text, disabled });
    return (
      <>
        <input value={text} disabled={disabled} readOnly />
        {endIcon}
      </>
    );
  },
}));

function packageInfo(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return {
    id: 'package',
    criticality: Criticality.None,
    packageName: 'initial',
    packageNamespace: 'scope',
    packageType: 'npm',
    packageVersion: '1.0.0',
    ...overrides,
  };
}

describe('PurlField', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('updates the displayed and copied PURL when coordinates change', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const onUpdate = vi.fn();
    const { rerender } = await renderComponent(
      <PurlField packageInfo={packageInfo()} onUpdate={onUpdate} />,
    );

    expect(screen.getByRole('textbox')).toHaveValue(
      'pkg:npm/scope/initial@1.0.0',
    );

    rerender(
      <PurlField
        packageInfo={packageInfo({
          packageName: 'updated',
          packageVersion: '2.0.0',
        })}
        onUpdate={onUpdate}
      />,
    );
    await user.click(
      screen.getByLabelText(text.attributionColumn.copyToClipboard),
    );

    expect(screen.getByRole('textbox')).toHaveValue(
      'pkg:npm/scope/updated@2.0.0',
    );
    expect(writeText).toHaveBeenCalledWith('pkg:npm/scope/updated@2.0.0');
  });

  it('applies all package coordinates from a valid pasted PURL', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: vi.fn().mockResolvedValue('pkg:maven/org.example/name@2.0.0'),
      },
    });
    await renderComponent(
      <PurlField packageInfo={packageInfo()} onUpdate={onUpdate} />,
    );

    await user.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );

    expect(onUpdate).toHaveBeenCalledWith({
      packageName: 'name',
      packageNamespace: 'org.example',
      packageType: 'maven',
      packageVersion: '2.0.0',
    });
  });

  it('clears omitted namespace and version from a pasted PURL', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    vi.stubGlobal('navigator', {
      clipboard: { readText: vi.fn().mockResolvedValue('pkg:npm/name') },
    });
    await renderComponent(
      <PurlField packageInfo={packageInfo()} onUpdate={onUpdate} />,
    );

    await user.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );

    expect(onUpdate).toHaveBeenCalledWith({
      packageName: 'name',
      packageNamespace: undefined,
      packageType: 'npm',
      packageVersion: undefined,
    });
  });

  it('uses replacement callbacks for a confirmed paste and leaves cancellation unchanged', async () => {
    const user = userEvent.setup();
    const firstUpdate = vi.fn();
    const replacementUpdate = vi.fn();
    const cancelledEdit = vi.fn(() => Promise.resolve(false));
    const confirmedEdit = vi.fn((onConfirm: () => void) => {
      onConfirm();
      return Promise.resolve(true);
    });
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: vi.fn().mockResolvedValue('pkg:npm/replacement@3.0.0'),
      },
    });
    const { rerender } = await renderComponent(
      <PurlField
        packageInfo={packageInfo()}
        onUpdate={firstUpdate}
        onEdit={cancelledEdit}
      />,
    );

    await user.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );
    expect(firstUpdate).not.toHaveBeenCalled();

    rerender(
      <PurlField
        packageInfo={packageInfo()}
        onUpdate={replacementUpdate}
        onEdit={confirmedEdit}
      />,
    );
    await user.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );

    expect(replacementUpdate).toHaveBeenCalledWith({
      packageName: 'replacement',
      packageNamespace: undefined,
      packageType: 'npm',
      packageVersion: '3.0.0',
    });
  });

  it('skips unchanged PURL input renders while paste uses replacement callbacks', async () => {
    const user = userEvent.setup();
    const firstUpdate = vi.fn();
    const replacementUpdate = vi.fn();
    const confirmedEdit = vi.fn((onConfirm: () => void) => {
      onConfirm();
      return Promise.resolve(true);
    });
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: vi.fn().mockResolvedValue('pkg:npm/replacement@3.0.0'),
      },
    });
    const { rerender } = await renderComponent(
      <PurlField packageInfo={packageInfo()} onUpdate={firstUpdate} />,
    );
    textBox.render.mockClear();

    rerender(
      <PurlField
        packageInfo={packageInfo({
          comment: 'changed comment',
          copyright: 'changed copyright',
        })}
        onUpdate={replacementUpdate}
        onEdit={confirmedEdit}
      />,
    );

    expect(textBox.render).not.toHaveBeenCalled();
    await user.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );
    expect(replacementUpdate).toHaveBeenCalledWith({
      packageName: 'replacement',
      packageNamespace: undefined,
      packageType: 'npm',
      packageVersion: '3.0.0',
    });
  });

  it('rerenders the PURL input for coordinate and presentation changes', async () => {
    const { rerender } = await renderComponent(
      <PurlField packageInfo={packageInfo()} onUpdate={vi.fn()} />,
    );
    textBox.render.mockClear();

    rerender(
      <PurlField
        packageInfo={packageInfo({ packageVersion: '2.0.0' })}
        onUpdate={vi.fn()}
      />,
    );
    expect(textBox.render).toHaveBeenCalledOnce();
    expect(screen.getByRole('textbox')).toHaveValue(
      'pkg:npm/scope/initial@2.0.0',
    );

    textBox.render.mockClear();
    rerender(
      <PurlField
        packageInfo={packageInfo({ packageVersion: '2.0.0' })}
        onUpdate={vi.fn()}
        disabled
      />,
    );
    expect(textBox.render).toHaveBeenCalledOnce();
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('reports invalid pasted text and hides paste for read-only and busy fields', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('navigator', {
      clipboard: { readText: vi.fn().mockResolvedValue('not a PURL') },
    });
    const { rerender } = await renderComponent(
      <PurlField packageInfo={packageInfo()} onUpdate={vi.fn()} />,
    );

    await user.click(
      screen.getByLabelText(text.attributionColumn.pasteFromClipboard),
    );
    expect(toaster.error).toHaveBeenCalledWith(
      text.attributionColumn.pasteFromClipboardFailed,
    );

    rerender(
      <PurlField packageInfo={packageInfo()} onUpdate={vi.fn()} readOnly />,
    );
    expect(
      screen.queryByLabelText(text.attributionColumn.pasteFromClipboard),
    ).not.toBeInTheDocument();

    rerender(
      <PurlField packageInfo={packageInfo()} onUpdate={vi.fn()} disabled />,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(
      screen.queryByLabelText(text.attributionColumn.pasteFromClipboard),
    ).not.toBeInTheDocument();
  });
});
