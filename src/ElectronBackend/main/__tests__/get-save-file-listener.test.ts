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
  saveFileListener,
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

(getMainDbClient as Mock).mockReturnValue({
  saveFile: mockSaveFile,
  splitOpossumFile: mockSplitOpossumFile,
});

describe('saveFileListener', () => {
  afterEach(() => {
    vi.resetAllMocks();
    (getMainDbClient as Mock).mockReturnValue({
      saveFile: mockSaveFile,
      splitOpossumFile: mockSplitOpossumFile,
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
      inputFileChecksum: 'checksum_abc',
    });

    await saveFileListener(mainWindow)(AllowedFrontendChannels.SaveFileRequest);

    expect(mockSaveFile).toHaveBeenCalledWith({
      projectId: 'uuid_1',
      inputFileChecksum: 'checksum_abc',
      opossumFilePath: '/my/file.opossum',
      attributionFilePath: undefined,
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
      inputFileChecksum: 'checksum_abc',
      opossumFilePath: '/my/file.opossum',
      projectId: 'uuid_1',
    });
  });

  it('uses the selected destination from the opossum save dialog', async () => {
    const selectedPartitionPath = '/partitions/source-partition.opossum';
    vi.mocked(saveOpossumFileDialog).mockReturnValue(selectedPartitionPath);

    await splitCurrentOpossumFileListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
    );

    expect(saveOpossumFileDialog).toHaveBeenCalledWith(
      '/my/file-source.opossum',
    );
    expect(mockSplitOpossumFile).toHaveBeenCalledWith({
      projectId: 'uuid_1',
      inputFileChecksum: 'checksum_abc',
      opossumFilePath: '/my/file.opossum',
      overwriteExistingDestination: true,
      selectedFolderPaths: ['/source'],
      selectedPartitionPath,
    });
  });

  it('does not split when selecting a destination is cancelled', async () => {
    vi.mocked(saveOpossumFileDialog).mockReturnValue(undefined);

    const splitSucceeded = await splitCurrentOpossumFileListener(mainWindow)(
      {} as Electron.IpcMainInvokeEvent,
      ['/source'],
    );

    expect(splitSucceeded).toBe(false);
    expect(mockSplitOpossumFile).not.toHaveBeenCalled();
  });
});
