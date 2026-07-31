// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { MergeOpossumFilesDialog } from '../MergeOpossumFilesDialog';

describe('MergeOpossumFilesDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('selects input files for merging into the current file', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/second.opossum',
    ];
    vi.mocked(window.electronAPI.selectOpossumFiles).mockResolvedValue(
      inputFilePaths,
    );

    await renderComponent(
      <MergeOpossumFilesDialog
        currentFilePath={'/current/project.opossum'}
        mergeIntoCurrentFile={true}
      />,
    );

    expect(
      screen.queryByTestId('merge-opossum-files-output-path-input'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('/current/project.opossum')).toBeInTheDocument();

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );

    await waitFor(() =>
      expect(window.electronAPI.selectOpossumFiles).toHaveBeenCalledOnce(),
    );
    expect(screen.getByText(inputFilePaths[0])).toBeInTheDocument();
    expect(screen.getByText(inputFilePaths[1])).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: text.buttons.merge }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: text.buttons.merge }));

    await waitFor(() =>
      expect(window.electronAPI.mergeOpossumFiles).toHaveBeenCalledWith(
        inputFilePaths,
        false,
      ),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: text.mergeOpossumFilesDialog.removeSplitFile(inputFilePaths[0]),
      }),
    );

    expect(screen.queryByText(inputFilePaths[0])).not.toBeInTheDocument();
    expect(screen.getByText(inputFilePaths[1])).toBeInTheDocument();
  });

  it('merges selected files outside the current project', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/second.opossum',
    ];
    const outputFilePath = '/merged/output.opossum';
    vi.mocked(window.electronAPI.selectOpossumFiles).mockResolvedValue(
      inputFilePaths,
    );
    vi.mocked(
      window.electronAPI.selectOpossumFileSaveLocation,
    ).mockResolvedValue(outputFilePath);

    await renderComponent(
      <MergeOpossumFilesDialog mergeIntoCurrentFile={false} />,
    );

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    );

    await waitFor(() =>
      expect(
        window.electronAPI.selectOpossumFileSaveLocation,
      ).toHaveBeenCalledWith('merged.opossum'),
    );
    expect(screen.getByText(outputFilePath)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: text.buttons.merge }));

    await waitFor(() =>
      expect(
        window.electronAPI.mergeOpossumFilesFromPaths,
      ).toHaveBeenCalledWith(inputFilePaths, outputFilePath, false),
    );
  });
});
