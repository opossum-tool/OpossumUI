// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, dialog } from 'electron';
import { type Mock } from 'vitest';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { type ParsedFrontendFileContent } from '../../../shared/shared-types';
import { getMainDbClient } from '../../dbProcess/dbProcessClient';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from '../../main/globalBackendState';
import { loadInputAndOutputFromFilePath } from '../importFromFile';
import type { LoadFileIpcResult } from '../loadFile';

vi.mock('electron', () => ({
  dialog: {
    showOpenDialogSync: vi.fn(),
    showMessageBox: vi.fn(),
  },
  BrowserWindow: {
    getFocusedWindow: vi.fn(),
  },
  app: { exit: vi.fn(), getName: vi.fn(), getVersion: vi.fn() },
}));

vi.mock('../../dbProcess/dbProcessClient', () => ({
  getMainDbClient: vi.fn(),
}));

const mockLoadFile = vi.fn();

(getMainDbClient as Mock).mockReturnValue({
  loadFile: mockLoadFile,
});

type SendCall = {
  channel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Array<any>;
};

class MockWebContents {
  #calls: Array<SendCall> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(channel: string, args: Array<any>): void {
    this.#calls.push({ channel, args });
  }

  #callsFromChannel(channel: AllowedFrontendChannels): Array<SendCall> {
    return this.#calls.filter(
      (sendCall) => sendCall.channel === String(channel),
    );
  }

  numberOfCallsFromChannel(channel: AllowedFrontendChannels): number {
    return this.#callsFromChannel(channel).length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastArgumentFromChannel(channel: AllowedFrontendChannels): any {
    const callsFromChannel = this.#callsFromChannel(channel);
    if (callsFromChannel.length) {
      return callsFromChannel[callsFromChannel.length - 1].args;
    }
    return undefined;
  }

  reset(): void {
    this.#calls = [];
  }
}

const mainWindow = {
  webContents: new MockWebContents(),
  setTitle: vi.fn(),
} as unknown as BrowserWindow;

const testFrontendData: ParsedFrontendFileContent = {
  metadata: EMPTY_PROJECT_METADATA,
  config: { classifications: {} },
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
  },
  frequentLicenses: { nameOrder: [], texts: {} },
  resolvedExternalAttributions: new Set(),
  attributionBreakpoints: new Set(),
  filesWithChildren: new Set(),
  baseUrlsForSources: {},
  externalAttributionSources: {},
};

describe('loadInputAndOutputFromFilePath', () => {
  afterEach(() => {
    vi.resetAllMocks();
    (getMainDbClient as Mock).mockReturnValue({
      loadFile: mockLoadFile,
    });
    (mainWindow.webContents as unknown as MockWebContents).reset();
  });

  it('sends IPC messages and updates global state on success', async () => {
    mockLoadFile.mockResolvedValue({
      ok: true,
      frontendData: testFrontendData,
      projectTitle: 'My Project',
      projectId: 'project-123',
    } satisfies LoadFileIpcResult);

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, '/some/file.opossum');

    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.numberOfCallsFromChannel(
        AllowedFrontendChannels.ResetLoadedFile,
      ),
    ).toBe(1);
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(1);
    expect(
      webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toEqual(testFrontendData);
    expect(getGlobalBackendState().projectTitle).toBe('My Project');
    expect(getGlobalBackendState().projectId).toBe('project-123');
  });

  it('shows error dialog and does not send FileLoaded on error', async () => {
    mockLoadFile.mockResolvedValue({
      ok: false,
      error: { type: 'fileNotFoundError', message: 'File not found' },
    } satisfies LoadFileIpcResult);

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, '/missing/file.json');

    expect(dialog.showMessageBox).toHaveBeenCalled();
    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(0);
  });

  it('routes each error type to the correct dialog', async () => {
    const errorTypes = [
      { type: 'fileNotFoundError' as const, expectedMessage: 'open the file' },
      {
        type: 'jsonParsingError' as const,
        expectedMessage: 'parsing the input',
      },
      {
        type: 'unzipError' as const,
        expectedMessage: 'unzip the file',
      },
      {
        type: 'invalidDotOpossumFileError' as const,
        expectedMessage: "'.opossum' file",
      },
    ];

    for (const { type, expectedMessage } of errorTypes) {
      vi.resetAllMocks();
      (getMainDbClient as Mock).mockReturnValue({
        loadFile: mockLoadFile,
      });
      (mainWindow.webContents as unknown as MockWebContents).reset();

      mockLoadFile.mockResolvedValue({
        ok: false,
        error: { type, message: 'test error' },
      } satisfies LoadFileIpcResult);

      setGlobalBackendState({});
      await loadInputAndOutputFromFilePath(mainWindow, '/file');

      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(expectedMessage),
        }),
      );
    }
  });
});
