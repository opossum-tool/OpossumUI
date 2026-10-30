// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindow } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { setGlobalBackendState } from '../globalBackendState';
import {
  acknowledgeQuitRequest,
  confirmQuit,
  handleWindowClose,
  resetQuitStateForTesting,
} from '../quit-handling';

const whenIdleMock = vi.hoisted(() => vi.fn());
const saveFileMock = vi.hoisted(() => vi.fn());
const isDeadMock = vi.hoisted(() => vi.fn());
const showMessageBoxMock = vi.hoisted(() => vi.fn());
const quitMock = vi.hoisted(() => vi.fn());

vi.mock('electron', () => ({
  app: { quit: quitMock },
}));

vi.mock('../../dbProcess/dbProcessClient', () => ({
  getMainDbClient: () => ({
    whenIdle: whenIdleMock,
    saveFile: saveFileMock,
    isDead: isDeadMock,
  }),
}));

vi.mock('../../errorHandling/errorHandling', () => ({
  showListenerErrorInMessageBox: showMessageBoxMock,
}));

const UNRESPONSIVE_TIMEOUT_MS = 11000;

function createWindowMock(
  webContentsOverrides: Partial<{
    isDestroyed: boolean;
    isCrashed: boolean;
    isLoading: boolean;
  }> = {},
): {
  window: BrowserWindow;
  send: ReturnType<typeof vi.fn>;
  preventDefault: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn();
  const preventDefault = vi.fn();
  const window = {
    webContents: {
      send,
      isDestroyed: vi.fn(() => webContentsOverrides.isDestroyed ?? false),
      isCrashed: vi.fn(() => webContentsOverrides.isCrashed ?? false),
      isLoading: vi.fn(() => webContentsOverrides.isLoading ?? false),
    },
    close: vi.fn(),
  } as unknown as BrowserWindow;
  return { window, send, preventDefault };
}

function closeWindow(window: BrowserWindow, preventDefaultMock: unknown): void {
  const event = {
    preventDefault: preventDefaultMock as () => void,
    type: 'close',
  } as unknown as Electron.Event;
  handleWindowClose(window, event);
}

describe('handleWindowClose', () => {
  let currentTimestamp: number;

  beforeAll(() => {
    vi.spyOn(Date, 'now').mockImplementation(() => currentTimestamp);
  });

  beforeEach(() => {
    resetQuitStateForTesting();
    currentTimestamp = 0;
    whenIdleMock.mockReset().mockResolvedValue(undefined);
    saveFileMock.mockReset().mockResolvedValue(undefined);
    isDeadMock.mockReset().mockReturnValue(false);
    showMessageBoxMock.mockReset().mockResolvedValue(undefined);
    quitMock.mockReset();
  });

  it('prevents the close and requests quit approval from the renderer', () => {
    const { window, send, preventDefault } = createWindowMock();

    closeWindow(window, preventDefault);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledExactlyOnceWith(
      AllowedFrontendChannels.RequestQuitApproval,
    );
  });

  it.each([
    { description: 'destroyed web contents', isDestroyed: true },
    { description: 'crashed web contents', isCrashed: true },
    { description: 'loading web contents', isLoading: true },
  ])(
    'lets the window close when the renderer cannot respond ($description)',
    (webContentsOverrides) => {
      const { window, send, preventDefault } =
        createWindowMock(webContentsOverrides);

      closeWindow(window, preventDefault);

      expect(preventDefault).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    },
  );

  it('force-quits on repeated close attempts when the renderer stays unresponsive', async () => {
    const { window, send, preventDefault } = createWindowMock();
    closeWindow(window, preventDefault);

    currentTimestamp += UNRESPONSIVE_TIMEOUT_MS;
    closeWindow(window, preventDefault);

    expect(preventDefault).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(quitMock).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does not force-quit when the renderer acknowledged the request', async () => {
    const { window, send, preventDefault } = createWindowMock();
    closeWindow(window, preventDefault);
    acknowledgeQuitRequest();

    currentTimestamp += UNRESPONSIVE_TIMEOUT_MS;
    closeWindow(window, preventDefault);

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledTimes(2);
    await Promise.resolve();
    expect(quitMock).not.toHaveBeenCalled();
  });
});

describe('confirmQuit', () => {
  beforeEach(() => {
    resetQuitStateForTesting();
    setGlobalBackendState({});
    whenIdleMock.mockReset().mockResolvedValue(undefined);
    saveFileMock.mockReset().mockResolvedValue(undefined);
    isDeadMock.mockReset().mockReturnValue(false);
    showMessageBoxMock.mockReset().mockResolvedValue(undefined);
    quitMock.mockReset();
  });

  it('waits for pending DB process requests, writes the project file, then quits', async () => {
    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    let resolveWhenIdle!: () => void;
    whenIdleMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveWhenIdle = resolve;
      }),
    );

    const quitPromise = confirmQuit(createWindowMock().window);
    expect(quitMock).not.toHaveBeenCalled();

    resolveWhenIdle();
    await quitPromise;

    expect(whenIdleMock).toHaveBeenCalledTimes(1);
    expect(saveFileMock).toHaveBeenCalledExactlyOnceWith({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('quits without writing when no project is loaded', async () => {
    await confirmQuit(createWindowMock().window);

    expect(saveFileMock).not.toHaveBeenCalled();
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('skips the final write when the DB process is dead', async () => {
    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    isDeadMock.mockReturnValue(true);

    await confirmQuit(createWindowMock().window);

    expect(saveFileMock).not.toHaveBeenCalled();
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the app open and shows the error when the final write fails', async () => {
    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    saveFileMock.mockRejectedValue(new Error('write failed'));

    await confirmQuit(createWindowMock().window);

    expect(showMessageBoxMock).toHaveBeenCalledTimes(1);
    expect(quitMock).not.toHaveBeenCalled();

    // The user is prompted again when trying to close afterwards.
    const { preventDefault } = createWindowMock();
    closeWindow(createWindowMock().window, preventDefault);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('quits anyway if the final write fails in the forced path', async () => {
    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    saveFileMock.mockRejectedValue(new Error('write failed'));

    await confirmQuit(createWindowMock().window, { force: true });

    expect(quitMock).toHaveBeenCalledTimes(1);
    expect(showMessageBoxMock).not.toHaveBeenCalled();
  });

  it('ignores close attempts while the final save is in flight', async () => {
    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    let resolveWhenIdle!: () => void;
    whenIdleMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveWhenIdle = resolve;
      }),
    );

    const quitPromise = confirmQuit(createWindowMock().window);

    const midSave = createWindowMock();
    closeWindow(midSave.window, midSave.preventDefault);
    expect(midSave.preventDefault).toHaveBeenCalledTimes(1);
    expect(midSave.send).not.toHaveBeenCalled();

    resolveWhenIdle();
    await quitPromise;
  });

  it('lets the window close once quit is finalized', async () => {
    setGlobalBackendState({
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });

    await confirmQuit(createWindowMock().window);
    expect(quitMock).toHaveBeenCalledTimes(1);

    const { preventDefault } = createWindowMock();
    closeWindow(createWindowMock().window, preventDefault);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
