// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { executeCommand } from '../../../../ElectronBackend/api/commands';
import {
  MergeOpossumFilesErrorType,
  OPOSSUM_FILE_FORMAT,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { pathsToResources } from '../../../../testing/global-test-helpers';
import {
  expectAlert,
  expectButtonDisabled,
  expectButtonEnabled,
  expectButtonVisibility,
  expectTextVisible,
  getButton,
  MERGE_DIALOG_LABEL,
} from '../../../../testing/ui';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { MergeOpossumFilesDialog } from '../MergeOpossumFilesDialog';

describe('MergeOpossumFilesDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('informs the user when the current project has no readonly paths', async () => {
    vi.mocked(window.electronAPI.api).mockImplementation(executeCommand);

    await renderComponent(
      <MergeOpossumFilesDialog canMergeIntoCurrentFile={true} />,
      {
        data: getParsedInputFileEnrichedWithTestData({
          resources: pathsToResources(['/editable/file.ts']),
          readonlyRules: [],
        }),
      },
    );

    await expectAlert(
      text.mergeOpossumFilesDialog.noReadonlyPathsWarning,
      true,
      'warning',
      screen.getByLabelText(MERGE_DIALOG_LABEL),
    );
    expect(screen.getByRole('switch')).toBeEnabled();
    expectButtonDisabled(text.buttons.merge);

    await userEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );
    expect(window.electronAPI.selectFiles).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('switch'));
    await expectAlert(
      text.mergeOpossumFilesDialog.noReadonlyPathsWarning,
      false,
      'warning',
      screen.getByLabelText(MERGE_DIALOG_LABEL),
    );
    expect(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    ).toBeInTheDocument();
  });

  it('selects input files for merging into the current file', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/second.opossum',
    ];
    vi.mocked(window.electronAPI.selectFiles).mockResolvedValue(inputFilePaths);

    await renderComponent(
      <MergeOpossumFilesDialog
        currentFilePath={'/current/project.opossum'}
        canMergeIntoCurrentFile={true}
      />,
    );

    expect(
      screen.queryByTestId('merge-opossum-files-output-path-input'),
    ).not.toBeInTheDocument();
    await expectTextVisible('/current/project.opossum', true);

    await userEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );

    await waitFor(() =>
      expect(window.electronAPI.selectFiles).toHaveBeenCalledWith(
        OPOSSUM_FILE_FORMAT,
      ),
    );
    await expectTextVisible(inputFilePaths[0], true);
    await expectTextVisible(inputFilePaths[1], true);

    expectButtonEnabled(text.buttons.merge);
    vi.mocked(window.electronAPI.mergeOpossumFiles).mockResolvedValue({
      status: 'success',
    });
    await userEvent.click(getButton(text.buttons.merge));

    await waitFor(() =>
      expect(window.electronAPI.mergeOpossumFiles).toHaveBeenCalledWith(
        inputFilePaths,
        false,
      ),
    );

    await userEvent.click(
      getButton(
        text.mergeOpossumFilesDialog.removeSplitFile(inputFilePaths[0]),
      ),
    );

    await expectTextVisible(inputFilePaths[0], false);
    await expectTextVisible(inputFilePaths[1], true);
  });

  it('merges selected files outside the current project', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/second.opossum',
    ];
    const outputFilePath = '/merged/output.opossum';
    vi.mocked(window.electronAPI.selectFiles).mockResolvedValue(inputFilePaths);
    vi.mocked(window.electronAPI.selectSaveFile).mockResolvedValue(
      outputFilePath,
    );

    await renderComponent(
      <MergeOpossumFilesDialog canMergeIntoCurrentFile={false} />,
    );

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    );

    await waitFor(() =>
      expect(window.electronAPI.selectSaveFile).toHaveBeenCalledWith({
        defaultPath: 'merged.opossum',
        filter: OPOSSUM_FILE_FORMAT,
      }),
    );
    await expectTextVisible(outputFilePath, true);
    vi.mocked(window.electronAPI.mergeOpossumFilesFromPaths).mockResolvedValue({
      status: 'success',
    });
    await userEvent.click(getButton(text.buttons.merge));

    await waitFor(() =>
      expect(
        window.electronAPI.mergeOpossumFilesFromPaths,
      ).toHaveBeenCalledWith(inputFilePaths, outputFilePath, false),
    );
  });

  it('warns and allows merging anyway when readonly resource outputs conflict', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/second.opossum',
    ];
    const outputFilePath = '/merged/output.opossum';
    vi.mocked(window.electronAPI.selectFiles).mockResolvedValue(inputFilePaths);
    vi.mocked(window.electronAPI.selectSaveFile).mockResolvedValue(
      outputFilePath,
    );
    vi.mocked(window.electronAPI.mergeOpossumFilesFromPaths)
      .mockResolvedValueOnce({
        errorType: MergeOpossumFilesErrorType.ReadonlyResourceOutputConflict,
        status: 'error',
      })
      .mockResolvedValueOnce({ status: 'success' });

    await renderComponent(
      <MergeOpossumFilesDialog canMergeIntoCurrentFile={false} />,
    );

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );
    await expectTextVisible(inputFilePaths[0], true);
    fireEvent.click(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    );

    await expectTextVisible(outputFilePath, true);
    await userEvent.click(getButton(text.buttons.merge));

    await expectAlert(
      text.mergeOpossumFilesDialog.readonlyResourceOutputConflictWarning,
      true,
      'warning',
      screen.getByLabelText(MERGE_DIALOG_LABEL),
    );

    await userEvent.click(
      getButton(
        text.mergeOpossumFilesDialog
          .mergeIgnoringReadonlyResourceOutputConflicts,
      ),
    );

    await waitFor(() =>
      expect(
        window.electronAPI.mergeOpossumFilesFromPaths,
      ).toHaveBeenLastCalledWith(inputFilePaths, outputFilePath, true),
    );
  });

  it('resets readonly conflict confirmation when changing merge mode', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/second.opossum',
    ];
    const outputFilePath = '/merged/output.opossum';
    vi.mocked(window.electronAPI.selectFiles).mockResolvedValue(inputFilePaths);
    vi.mocked(window.electronAPI.selectSaveFile).mockResolvedValue(
      outputFilePath,
    );
    vi.mocked(window.electronAPI.mergeOpossumFilesFromPaths).mockResolvedValue({
      errorType: MergeOpossumFilesErrorType.ReadonlyResourceOutputConflict,
      status: 'error',
    });
    vi.mocked(window.electronAPI.mergeOpossumFiles).mockResolvedValue({
      status: 'success',
    });

    await renderComponent(
      <MergeOpossumFilesDialog canMergeIntoCurrentFile={true} />,
    );

    await userEvent.click(screen.getByRole('switch'));
    expect(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );
    fireEvent.click(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    );
    await expectTextVisible(outputFilePath, true);
    await userEvent.click(getButton(text.buttons.merge));

    await expectAlert(
      text.mergeOpossumFilesDialog.readonlyResourceOutputConflictWarning,
      true,
      'warning',
      screen.getByLabelText(MERGE_DIALOG_LABEL),
    );

    await userEvent.click(screen.getByRole('switch'));

    await expectAlert(
      text.mergeOpossumFilesDialog.readonlyResourceOutputConflictWarning,
      false,
      'warning',
      screen.getByLabelText(MERGE_DIALOG_LABEL),
    );
    await expectButtonVisibility(
      text.mergeOpossumFilesDialog.mergeIgnoringReadonlyResourceOutputConflicts,
      false,
    );

    await userEvent.click(getButton(text.buttons.merge));

    await waitFor(() =>
      expect(window.electronAPI.mergeOpossumFiles).toHaveBeenCalledWith(
        inputFilePaths,
        false,
      ),
    );
  });

  it('warns about other merge errors so the user can adjust the selection', async () => {
    const inputFilePaths = [
      '/partitions/first.opossum',
      '/partitions/corrupt.opossum',
    ];
    const outputFilePath = '/merged/output.opossum';
    const errorMessage =
      "Cannot merge '/partitions/corrupt.opossum': invalid or unsupported zip format";
    vi.mocked(window.electronAPI.selectFiles).mockResolvedValue(inputFilePaths);
    vi.mocked(window.electronAPI.selectSaveFile).mockResolvedValue(
      outputFilePath,
    );
    vi.mocked(window.electronAPI.mergeOpossumFilesFromPaths).mockResolvedValue({
      errorMessage,
      errorType: MergeOpossumFilesErrorType.Unknown,
      status: 'error',
    });

    await renderComponent(
      <MergeOpossumFilesDialog canMergeIntoCurrentFile={false} />,
    );

    fireEvent.click(
      screen.getByTestId('merge-opossum-files-input-paths-input'),
    );
    fireEvent.click(
      screen.getByTestId('merge-opossum-files-output-path-input'),
    );

    await expectTextVisible(outputFilePath, true);
    await userEvent.click(getButton(text.buttons.merge));

    await expectAlert(
      errorMessage,
      true,
      'error',
      screen.getByLabelText(MERGE_DIALOG_LABEL),
    );
    expectButtonEnabled(text.buttons.merge);
  });
});
