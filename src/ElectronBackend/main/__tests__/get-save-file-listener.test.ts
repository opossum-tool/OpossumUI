// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog, WebContents } from 'electron';
import * as MockDate from 'mockdate';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { Criticality } from '../../../shared/shared-types';
import { writeFile } from '../../../shared/write-file';
import { initializeDbWithTestData } from '../../../testing/global-test-helpers';
import { setGlobalBackendState } from '../globalBackendState';
import { saveFileListener } from '../listeners';

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

vi.mock('../../../shared/write-file', async () => ({
  ...(await vi.importActual('../../../shared/write-file')),
  writeFile: vi.fn(),
}));

const mockDate = 1603976726737;
MockDate.set(new Date(mockDate));

describe('getSaveFileListener', () => {
  it('throws error when projectId is not set', async () => {
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
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('throws error when attributionFilePath and opossumFilePath are not set', async () => {
    const mockCallback = vi.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    setGlobalBackendState({});

    await initializeDbWithTestData();

    setGlobalBackendState({
      projectId: 'uuid_1',
    });

    await saveFileListener(mainWindow)(AllowedFrontendChannels.SaveFileRequest);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message:
          'Error in app backend: Tried to get file type when no file is loaded',
        buttons: ['Reload File', 'Quit'],
      }),
    );
    expect(writeFile).not.toHaveBeenCalled();
  });

  it(
    'calls createListenerCallBackWithErrorHandling when ' +
      'resourceFilePath, attributionFilePath and projectId are set',
    async () => {
      const mockCallback = vi.fn();
      const mainWindow = {
        webContents: { send: mockCallback as unknown } as WebContents,
      } as unknown as BrowserWindow;
      setGlobalBackendState({});

      const listener = saveFileListener(mainWindow);

      await initializeDbWithTestData({
        externalAttributions: {
          attributions: {
            id_1: { id: 'id_1', criticality: Criticality.None },
            id_2: { id: 'id_2', criticality: Criticality.None },
          },
          resourcesToAttributions: {},
          attributionsToResources: {},
        },
        resolvedExternalAttributions: new Set(['id_1', 'id_2']),
      });

      setGlobalBackendState({
        resourceFilePath: '/resourceFile.json',
        attributionFilePath: '/attributionFile.json',
        projectId: 'uuid_1',
      });

      await listener(AllowedFrontendChannels.SaveFileRequest);

      expect(writeFile).toHaveBeenCalledWith({
        path: '/attributionFile.json',
        content: {
          manualAttributions: {},
          metadata: {
            projectId: 'uuid_1',
            fileCreationDate: `${mockDate}`,
          },
          resourcesToAttributions: {},
          resolvedExternalAttributions: ['id_1', 'id_2'],
        },
      });
    },
  );
});
