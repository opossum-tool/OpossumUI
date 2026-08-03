// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, dialog, type WebContents } from 'electron';
import type { Mock } from 'vitest';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { MergeOpossumFilesErrorType } from '../../../shared/shared-types';
import { getMainDbClient } from '../../dbProcess/dbProcessClient';
import { selectSaveFile } from '../dialogs';
import { setGlobalBackendState } from '../globalBackendState';
import {
  mergeCurrentOpossumFilesListener,
  mergeOpossumFilesFromPathsListener,
  saveFileListener,
  selectSplitDestinationListener,
  splitCurrentOpossumFileListener,
} from '../listeners';

vi.mock('electron', () => ({
  app: {
    getAppPath: () => './',
  },
  dialog: {
    showOpenDialogSync: vi.fn(),
    showMessageBox: vi.fn(() => {
      return Promise.resolve({
        response: 0,
      });
    }),
  },
}));

vi.mock('../../input/importFromFile', () => ({
  loadInputAndOutputFromFilePath: vi.fn(),
}));

vi.mock('../../dbProcess/dbProcessClient', () => ({
  getMainDbClient: vi.fn(),
}));

vi.mock('../dialogs', () => ({
  selectSaveFile: vi.fn(),
}));

const mockSaveFile = vi.fn();
const mockSplitOpossumFile = vi.fn();
const mockMergeOpossumFiles = vi.fn();
const mockMergeOpossumFilesFromPaths = vi.fn();

(getMainDbClient as Mock).mockReturnValue({
  saveFile: mockSaveFile,
  splitOpossumFile: mockSplitOpossumFile,
  mergeOpossumFiles: mockMergeOpossumFiles,
  mergeOpossumFilesFromPaths: mockMergeOpossumFilesFromPaths,
});

describe('saveFileListener', () => {
  afterEach(() => {
    vi.resetAllMocks();
    (getMainDbClient as Mock).mockReturnValue({
      saveFile: mockSaveFile,
      splitOpossumFile: mockSplitOpossumFile,
      mergeOpossumFiles: mockMergeOpossumFiles,
      mergeOpossumFilesFromPaths: mockMergeOpossumFilesFromPaths,
    });
  });

  it('shows error when projectId is not set', async () => {
    const mockCallback = vi.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    setGlobalBackendState({});

    await saveFileListener(mainWindow)(AllowedFrontendChannels.SaveFileRequest);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error in app backend: Project ID not found',
        buttons: ['Reload File', 'Quit'],
      }),
    );
    expect(mockSaveFile).not.toHaveBeenCalled();
  });

  it('forwards global state to getMainDbClient().saveFile()', async () => {
    mockSaveFile.mockResolvedValue(undefined);

    const mockCallback = vi.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;

    setGlobalBackendState({
      opossumFilePath: '/my/file.opossum',
      projectId: 'uuid_1',
    });

    await saveFileListener(mainWindow)(AllowedFrontendChannels.SaveFileRequest);

    expect(mockSaveFile).toHaveBeenCalledWith({
      projectId: 'uuid_1',
      opossumFilePath: '/my/file.opossum',
    });
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it('shows error dialog when saveFile rejects', async () => {
    mockSaveFile.mockRejectedValue(new Error('Save failed'));

    const mockCallback = vi.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;

    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/my/file.opossum',
    });

    await saveFileListener(mainWindow)(AllowedFrontendChannels.SaveFileRequest);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error in app backend: Save failed',
        buttons: ['Reload File', 'Quit'],
      }),
    );
  });
});

describe('splitCurrentOpossumFileListener', () => {
  const mainWindow = {
    webContents: { send: vi.fn() } as unknown,
  } as BrowserWindow;

  beforeEach(() => {
    vi.clearAllMocks();
    setGlobalBackendState({
      opossumFilePath: '/my/file.opossum',
      projectId: 'uuid_1',
    });
  });

  it('uses the destination provided by the split dialog', async () => {
    const splitOpossumFilePath = '/partitions/source-partition.opossum';

    await splitCurrentOpossumFileListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
      splitOpossumFilePath,
    );

    expect(mockSplitOpossumFile).toHaveBeenCalledWith({
      saveFileParams: {
        projectId: 'uuid_1',
        opossumFilePath: '/my/file.opossum',
      },
      selectedFolderPaths: ['/source'],
      splitOpossumFilePath,
    });
  });

  it('does not split without a destination', async () => {
    const splitResult = await splitCurrentOpossumFileListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
      '',
    );

    expect(splitResult).toEqual({ status: 'cancelled' });
    expect(mockSplitOpossumFile).not.toHaveBeenCalled();
  });

  it('returns an error result without showing a fatal error dialog', async () => {
    mockSplitOpossumFile.mockRejectedValue(
      new Error('Destination is not writable'),
    );

    const splitResult = await splitCurrentOpossumFileListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
      '/partitions/split.opossum',
    );

    expect(splitResult).toEqual({
      status: 'error',
      message: 'Destination is not writable',
    });
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it('opens a save dialog with a derived default split destination', () => {
    vi.mocked(selectSaveFile).mockReturnValue(
      '/partitions/source-partition.opossum',
    );

    const selectedPath = selectSplitDestinationListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
    );

    expect(selectSaveFile).toHaveBeenCalledWith({
      defaultPath: '/my/file-source.opossum',
      filter: { extensions: ['opossum'], name: 'Opossum File' },
    });
    expect(selectedPath).toBe('/partitions/source-partition.opossum');
  });
});

describe('mergeCurrentOpossumFilesListener', () => {
  const mainWindow = {
    webContents: { send: vi.fn() } as unknown,
  } as BrowserWindow;

  beforeEach(() => {
    vi.clearAllMocks();
    setGlobalBackendState({
      opossumFilePath: '/my/file.opossum',
      projectId: 'uuid_1',
    });
  });

  it('merges the provided partitions into the currently open archive', async () => {
    mockMergeOpossumFiles.mockResolvedValue({ status: 'success' });
    await mergeCurrentOpossumFilesListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
      false,
    );

    expect(mockMergeOpossumFiles).toHaveBeenCalledWith(
      {
        ignoreReadonlyResourceOutputConflicts: false,
        saveFileParams: {
          projectId: 'uuid_1',
          opossumFilePath: '/my/file.opossum',
        },
        partitionPaths: [
          '/partitions/docs.opossum',
          '/partitions/frontend.opossum',
        ],
      },
      expect.any(Function),
    );
  });

  it('returns an error result when no .opossum project is open', async () => {
    setGlobalBackendState({});

    await expect(
      mergeCurrentOpossumFilesListener(mainWindow)(
        {} as Electron.IpcMainInvokeEvent,
        ['/partitions/docs.opossum'],
        false,
      ),
    ).resolves.toEqual({
      errorMessage: 'No .opossum project is currently open.',
      errorType: 'unknown',
      status: 'error',
    });
  });
});

describe('mergeOpossumFilesFromPathsListener', () => {
  const mainWindow = {
    webContents: { send: vi.fn() } as unknown,
  } as BrowserWindow;

  it('forwards the selected archive paths without requiring an open project', async () => {
    mockMergeOpossumFilesFromPaths.mockResolvedValue({
      status: 'success',
    });
    await mergeOpossumFilesFromPathsListener(
      mainWindow,
      {} as Electron.IpcMainInvokeEvent,
      ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
      '/merged/project.opossum',
      false,
    );

    expect(mockMergeOpossumFilesFromPaths).toHaveBeenCalledWith(
      expect.objectContaining({
        ignoreReadonlyResourceOutputConflicts: false,
        inputPaths: [
          '/partitions/docs.opossum',
          '/partitions/frontend.opossum',
        ],
        outputPath: '/merged/project.opossum',
      }),
      expect.any(Function),
    );
  });

  it('forwards a readonly conflict result from the merge API', async () => {
    mockMergeOpossumFilesFromPaths.mockResolvedValue({
      errorType: MergeOpossumFilesErrorType.ReadonlyResourceOutputConflict,
      status: 'error',
    });

    await expect(
      mergeOpossumFilesFromPathsListener(
        mainWindow,
        {} as Electron.IpcMainInvokeEvent,
        ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
        '/merged/project.opossum',
        false,
      ),
    ).resolves.toEqual({
      errorType: 'readonly-resource-output-conflict',
      status: 'error',
    });
  });

  it('forwards an unknown error result from the merge API', async () => {
    mockMergeOpossumFilesFromPaths.mockResolvedValue({
      errorMessage: 'Output directory does not exist',
      errorType: MergeOpossumFilesErrorType.Unknown,
      status: 'error',
    });

    await expect(
      mergeOpossumFilesFromPathsListener(
        mainWindow,
        {} as Electron.IpcMainInvokeEvent,
        ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
        '/merged/project.opossum',
        false,
      ),
    ).resolves.toEqual({
      errorMessage: 'Output directory does not exist',
      errorType: 'unknown',
      status: 'error',
    });
  });
});
