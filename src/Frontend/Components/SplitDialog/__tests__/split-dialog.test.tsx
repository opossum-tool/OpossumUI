// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { text } from '../../../../shared/text';
import {
  clickPopupButton,
  expectSplitDialogCreateButtonEnabled,
  expectTextVisible,
  SPLIT_DIALOG_LABEL,
} from '../../../../testing/ui';
import {
  setExpandedIds,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { renderComponent } from '../../../test-helpers/render';
import { queryClient } from '../../AppContainer/queryClient';
import { SplitDialog } from '../SplitDialog';

describe('SplitDialog', () => {
  const resourcePath = '/source';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('selects a destination before enabling split creation', async () => {
    vi.mocked(window.electronAPI.selectSplitDestination).mockResolvedValue(
      '/partitions/source.opossum',
    );

    await renderComponent(
      <SplitDialog open={true} resourcePath={resourcePath} onClose={vi.fn()} />,
    );

    await expectSplitDialogCreateButtonEnabled(false);

    fireEvent.click(screen.getByTestId('split-destination-path-input'));

    await waitFor(() => {
      expect(window.electronAPI.selectSplitDestination).toHaveBeenCalledWith([
        resourcePath,
      ]);
    });
    await expectSplitDialogCreateButtonEnabled(true);
  });

  it('keeps the dialog open and displays a split error', async () => {
    const errorMessage = 'Destination is not writable';
    vi.mocked(window.electronAPI.selectSplitDestination).mockResolvedValue(
      '/partitions/source.opossum',
    );
    vi.mocked(window.electronAPI.splitFile).mockResolvedValue({
      status: 'error',
      message: errorMessage,
    });

    const { rerender } = await renderComponent(
      <SplitDialog open={true} resourcePath={resourcePath} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId('split-destination-path-input'));
    await expectSplitDialogCreateButtonEnabled(true);
    await clickPopupButton(SPLIT_DIALOG_LABEL, text.splitDialog.create);

    await expectTextVisible(errorMessage, true);

    rerender(
      <SplitDialog
        open={false}
        resourcePath={resourcePath}
        onClose={vi.fn()}
      />,
    );
    rerender(
      <SplitDialog open={true} resourcePath={resourcePath} onClose={vi.fn()} />,
    );

    await expectTextVisible(errorMessage, false);
    await expectSplitDialogCreateButtonEnabled(false);
  });

  it('resets the split inputs after a successful split', async () => {
    const onClose = vi.fn();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(window.electronAPI.selectSplitDestination).mockResolvedValue(
      '/partitions/source.opossum',
    );
    vi.mocked(window.electronAPI.splitFile).mockResolvedValue({
      status: 'success',
    });

    const { store } = await renderComponent(
      <SplitDialog open={true} resourcePath={resourcePath} onClose={onClose} />,
      {
        actions: [
          setSelectedResourceId(resourcePath, 'auto'),
          setExpandedIds(['/', resourcePath]),
        ],
      },
    );

    fireEvent.click(screen.getByTestId('split-destination-path-input'));
    await expectSplitDialogCreateButtonEnabled(true);
    await clickPopupButton(SPLIT_DIALOG_LABEL, text.splitDialog.create);

    expect(window.electronAPI.splitFile).toHaveBeenCalledWith(
      [resourcePath],
      '/partitions/source.opossum',
    );
    await expectTextVisible(text.splitDialog.success, true);
    expect(
      screen.getByTestId('split-destination-path-input'),
    ).toBeEmptyDOMElement();
    expect(
      screen.queryByRole('button', { name: resourcePath }),
    ).not.toBeInTheDocument();
    await expectSplitDialogCreateButtonEnabled(false);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['backend'],
    });
    expect(getSelectedResourceId(store.getState())).toBe(resourcePath);
    expect(getExpandedIds(store.getState())).toEqual(['/', resourcePath]);
    expect(onClose).not.toHaveBeenCalled();

    await clickPopupButton(SPLIT_DIALOG_LABEL, text.buttons.close);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('locks resource selection and indicates progress while splitting', async () => {
    let resolveSplit: (result: { status: 'success' }) => void;
    vi.mocked(window.electronAPI.selectSplitDestination).mockResolvedValue(
      '/partitions/source.opossum',
    );
    vi.mocked(window.electronAPI.splitFile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSplit = resolve;
        }),
    );

    await renderComponent(
      <SplitDialog open={true} resourcePath={resourcePath} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByTestId('split-destination-path-input'));
    await expectSplitDialogCreateButtonEnabled(true);
    await clickPopupButton(SPLIT_DIALOG_LABEL, text.splitDialog.create);

    await expectTextVisible(text.splitDialog.inProgress, true);
    expect(screen.getByRole('progressbar')).toBeVisible();
    resolveSplit!({ status: 'success' });
    await expectTextVisible(text.splitDialog.success, true);
    await expectTextVisible(text.splitDialog.inProgress, false);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
