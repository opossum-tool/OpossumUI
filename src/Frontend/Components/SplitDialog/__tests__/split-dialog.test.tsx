// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
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

    expect(
      screen.getByRole('button', { name: text.splitDialog.create }),
    ).toBeDisabled();

    fireEvent.click(screen.getByTestId('split-destination-path-input'));

    await waitFor(() => {
      expect(window.electronAPI.selectSplitDestination).toHaveBeenCalledWith([
        resourcePath,
      ]);
    });
    expect(
      screen.getByRole('button', { name: text.splitDialog.create }),
    ).toBeEnabled();
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
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: text.splitDialog.create }),
      ).toBeEnabled(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: text.splitDialog.create }),
    );

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();

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

    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: text.splitDialog.create }),
    ).toBeDisabled();
  });

  it('displays a success message until the user closes the dialog', async () => {
    const onClose = vi.fn();
    vi.mocked(window.electronAPI.selectSplitDestination).mockResolvedValue(
      '/partitions/source.opossum',
    );
    vi.mocked(window.electronAPI.splitFile).mockResolvedValue({
      status: 'success',
    });

    await renderComponent(
      <SplitDialog open={true} resourcePath={resourcePath} onClose={onClose} />,
    );

    fireEvent.click(screen.getByTestId('split-destination-path-input'));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: text.splitDialog.create }),
      ).toBeEnabled(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: text.splitDialog.create }),
    );

    expect(window.electronAPI.splitFile).toHaveBeenCalledWith(
      [resourcePath],
      '/partitions/source.opossum',
    );
    expect(
      await screen.findByText(text.splitDialog.success),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: text.buttons.close }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
