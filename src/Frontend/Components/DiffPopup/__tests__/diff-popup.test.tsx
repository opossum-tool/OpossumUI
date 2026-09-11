// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ThemeProvider } from '@mui/material/styles';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { executeCommand } from '../../../../ElectronBackend/api/commands';
import {
  type Attributions,
  Criticality,
  type PackageInfo,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { theme } from '../../App/App.style';
import type { ComparisonView } from '../ComparisonView';
import { type ComparisonItem, DiffPopup } from '../DiffPopup';

type ComparisonViewProps = ComponentProps<typeof ComparisonView>;

vi.mock('../ComparisonView', () => ({
  ComparisonView: ({ drafts, isBusy, onChange }: ComparisonViewProps) => (
    <div data-testid={'comparison-view-harness'}>
      {(['left', 'right'] as const).map((side) => (
        <input
          data-testid={`${side}-packageName`}
          disabled={isBusy}
          key={side}
          onChange={(event) =>
            onChange(side, { packageName: event.target.value })
          }
          value={drafts[side].packageName ?? ''}
        />
      ))}
    </div>
  ),
}));

function packageInfo(overrides: Partial<PackageInfo> = {}): PackageInfo {
  return {
    id: 'package',
    attributionConfidence: 50,
    criticality: Criticality.None,
    packageName: 'react',
    packageType: 'npm',
    licenseName: 'MIT',
    licenseText: 'MIT License',
    comment: 'opening comment',
    ...overrides,
  };
}

function item(overrides: Partial<ComparisonItem> = {}): ComparisonItem {
  return {
    isExternal: false,
    label: 'attribution',
    packageInfo: packageInfo(),
    ...overrides,
  };
}

async function renderPopup(
  leftItem: ComparisonItem,
  rightItem: ComparisonItem,
  options: {
    isOpen?: boolean;
    onClose?: () => void;
    onAcceptDrafts?: (accepted: Attributions) => void;
    data?: Parameters<typeof getParsedInputFileEnrichedWithTestData>[0];
  } = {},
) {
  return renderComponent(
    <ThemeProvider theme={theme}>
      <DiffPopup
        leftItem={leftItem}
        rightItem={rightItem}
        isOpen={options.isOpen ?? true}
        onClose={options.onClose ?? vi.fn()}
        onAcceptDrafts={options.onAcceptDrafts}
      />
    </ThemeProvider>,
    {
      data:
        options.data && getParsedInputFileEnrichedWithTestData(options.data),
    },
  );
}

function dismissWithEscape() {
  fireEvent.keyDown(screen.getByTestId('left-packageName'), {
    key: 'Escape',
  });
}

function dismissWithBackdrop() {
  const backdrop = within(
    screen.getByLabelText(text.diffPopup.ariaLabel),
  ).getByRole('presentation');
  fireEvent.mouseDown(backdrop);
  fireEvent.click(backdrop);
}

describe('DiffPopup', () => {
  afterEach(() => {
    vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);
  });

  it('saves changed candidates while accepting a restored side and locks the pending dialog', async () => {
    const leftPersisted = packageInfo({
      id: 'left',
      packageName: 'left persisted',
      comment: 'left comment',
    });
    const leftDraft = packageInfo({
      id: 'left',
      packageName: 'left pre-edited',
      comment: 'left comment',
    });
    const rightPersisted = packageInfo({
      id: 'right',
      packageName: 'right persisted',
      comment: 'right comment',
    });
    const rightDraft = packageInfo({
      id: 'right',
      packageName: 'right draft',
      comment: 'right comment',
    });
    const onClose = vi.fn();
    const onAcceptDrafts = vi.fn();
    let resolveRequest: (() => void) | undefined;
    vi.mocked(window.electronAPI.api).mockImplementation((command, params) =>
      command === 'updateOrMatchAttributions'
        ? new Promise<never>((resolve) => {
            resolveRequest = () =>
              resolve({
                result: { focusedAttributionOutcome: { status: 'unchanged' } },
                invalidates: [],
              } as never);
          })
        : executeCommand(command, params as never),
    );

    await renderPopup(
      item({
        packageInfo: leftDraft,
        originalPackageInfo: leftPersisted,
        label: 'left',
      }),
      item({
        packageInfo: rightDraft,
        originalPackageInfo: rightPersisted,
        label: 'right',
      }),
      {
        onClose,
        onAcceptDrafts,
        data: {
          manualAttributions: { left: leftDraft, right: rightDraft },
          resourcesToManualAttributions: { '/comparison': ['left', 'right'] },
          resources: pathsToResources(['/comparison']),
        },
      },
    );
    fireEvent.change(screen.getByTestId('right-packageName'), {
      target: { value: 'right persisted' },
    });
    const save = screen.getByRole('button', {
      name: text.diffPopup.saveChanges,
    });
    expect(save).toBeEnabled();
    fireEvent.click(save);

    expect(window.electronAPI.api).not.toHaveBeenCalledWith(
      'updateOrMatchAttributions',
      expect.anything(),
    );
    const confirmSave = await screen.findByRole('button', {
      name: text.saveAttributionsPopup.save,
    });
    await waitFor(() => expect(confirmSave).toBeEnabled());
    await userEvent.click(confirmSave);
    await waitFor(() => expect(save).toBeDisabled());
    expect(window.electronAPI.api).toHaveBeenCalledWith(
      'updateOrMatchAttributions',
      {
        attributions: { left: leftDraft },
        focusedAttributionUuid: 'right',
        selection: { mode: 'explicit', attributionUuids: ['left'] },
      },
    );
    expect(screen.getByTestId('left-packageName')).toBeDisabled();
    expect(screen.getByTestId('right-packageName')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: text.buttons.cancel }),
    ).toBeDisabled();
    dismissWithEscape();
    expect(onClose).not.toHaveBeenCalled();

    resolveRequest?.();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onAcceptDrafts).toHaveBeenCalledWith({
      left: leftDraft,
      right: rightPersisted,
    });
  });

  it.each([
    ['Escape', dismissWithEscape],
    ['backdrop click', dismissWithBackdrop],
  ])(
    'dismisses an idle popup with %s without reporting save success',
    async (_name, dismiss) => {
      const onClose = vi.fn();
      const onAcceptDrafts = vi.fn();
      await renderPopup(item(), item(), { onClose, onAcceptDrafts });

      dismiss();

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(onAcceptDrafts).not.toHaveBeenCalled();
    },
  );

  it('preserves drafts for stable comparison IDs and resets them for new or reopened sessions', async () => {
    const left = item({
      isExternal: true,
      label: 'left',
      packageInfo: packageInfo({ id: 'left' }),
    });
    const right = item({
      label: 'right',
      packageInfo: packageInfo({ id: 'right' }),
    });
    const view = await renderPopup(left, right);

    fireEvent.change(screen.getByTestId('right-packageName'), {
      target: { value: 'draft' },
    });
    view.rerender(
      <ThemeProvider theme={theme}>
        <DiffPopup
          leftItem={left}
          rightItem={item({
            label: 'right',
            packageInfo: packageInfo({
              id: 'right',
              packageName: 'refreshed',
            }),
          })}
          isOpen={true}
          onClose={vi.fn()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('right-packageName')).toHaveValue('draft');

    const newLeft = item({
      isExternal: true,
      label: 'new left',
      packageInfo: packageInfo({ id: 'new-left' }),
    });
    const newRight = item({
      label: 'new right',
      packageInfo: packageInfo({
        id: 'new-right',
        packageName: 'new opening',
      }),
    });
    view.rerender(
      <ThemeProvider theme={theme}>
        <DiffPopup
          leftItem={newLeft}
          rightItem={newRight}
          isOpen={true}
          onClose={vi.fn()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('right-packageName')).toHaveValue('new opening');
    view.rerender(
      <ThemeProvider theme={theme}>
        <DiffPopup
          leftItem={newLeft}
          rightItem={{
            ...newRight,
            packageInfo: packageInfo({
              id: 'new-right',
              packageName: 'reopened',
            }),
          }}
          isOpen={false}
          onClose={vi.fn()}
        />
      </ThemeProvider>,
    );
    view.rerender(
      <ThemeProvider theme={theme}>
        <DiffPopup
          leftItem={newLeft}
          rightItem={{
            ...newRight,
            packageInfo: packageInfo({
              id: 'new-right',
              packageName: 'reopened',
            }),
          }}
          isOpen={true}
          onClose={vi.fn()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('right-packageName')).toHaveValue('reopened');
  });
});
