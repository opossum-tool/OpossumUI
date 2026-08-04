// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, dialog, type WebContents } from 'electron';
import type { Mock } from 'vitest';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { getMainDbClient } from '../../dbProcess/dbProcessClient';
import { saveOpossumFileDialog } from '../dialogs';
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
  saveOpossumFileDialog: vi.fn(),
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
    vi.mocked(saveOpossumFileDialog).mockReturnValue(
      '/partitions/source-partition.opossum',
    );

    const selectedPath = selectSplitDestinationListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
    );

    expect(saveOpossumFileDialog).toHaveBeenCalledWith(
      '/my/file-source.opossum',
    );
    expect(selectedPath).toBe('/partitions/source-partition.opossum');
  });
});

describe('mergeCurrentOpossumFilesListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setGlobalBackendState({
      opossumFilePath: '/my/file.opossum',
      projectId: 'uuid_1',
    });
  });

  it('merges the provided partitions into the currently open archive', async () => {
    await mergeCurrentOpossumFilesListener()(
      {} as Electron.IpcMainInvokeEvent,
      ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
      false,
    );

    expect(mockMergeOpossumFiles).toHaveBeenCalledWith({
      ignoreReadonlyResourceOutputConflicts: false,
      saveFileParams: {
        projectId: 'uuid_1',
        opossumFilePath: '/my/file.opossum',
      },
      partitionPaths: [
        '/partitions/docs.opossum',
        '/partitions/frontend.opossum',
      ],
    });
  });

  it('rejects merging when no .opossum project is open', async () => {
    setGlobalBackendState({});

    await expect(
      mergeCurrentOpossumFilesListener()(
        {} as Electron.IpcMainInvokeEvent,
        ['/partitions/docs.opossum'],
        false,
      ),
    ).rejects.toThrow('No .opossum project is currently open.');
  });
});

describe('mergeOpossumFilesFromPathsListener', () => {
  it('forwards the selected archive paths without requiring an open project', async () => {
    await mergeOpossumFilesFromPathsListener(
      {} as Electron.IpcMainInvokeEvent,
      ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
      '/merged/project.opossum',
      false,
    );

    expect(mockMergeOpossumFilesFromPaths).toHaveBeenCalledWith({
      ignoreReadonlyResourceOutputConflicts: false,
      inputPaths: ['/partitions/docs.opossum', '/partitions/frontend.opossum'],
      outputPath: '/merged/project.opossum',
    });
  });
});
