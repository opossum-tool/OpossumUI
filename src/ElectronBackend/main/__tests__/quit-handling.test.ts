// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { BrowserWindow } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import type { SaveResult } from '../../../shared/shared-types';
import {
  acknowledgeQuitRequest,
  confirmQuit,
  handleWindowClose,
  resetQuitStateForTesting,
} from '../quit-handling';

const flushSavesMock = vi.hoisted(() => vi.fn());
const isDeadMock = vi.hoisted(() => vi.fn());
const quitMock = vi.hoisted(() => vi.fn());
const failure = {
  message: 'Disk full',
  id: 'first',
  fileName: 'project.opossum',
};

vi.mock('electron', () => ({
  app: { quit: quitMock },
}));

vi.mock('../../dbProcess/dbProcessClient', () => ({
  getMainDbClient: () => ({
    flushSaves: flushSavesMock,
    isDead: isDeadMock,
  }),
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
    isDestroyed: vi.fn(() => false),
    webContents: {
      id: 7,
      once: vi.fn(),
      removeListener: vi.fn(),
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
    flushSavesMock.mockReset().mockResolvedValue({ status: 'saved' });
    isDeadMock.mockReset().mockReturnValue(false);
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
    'flushes before quitting when the renderer cannot respond ($description)',
    async (webContentsOverrides) => {
      const { window, send, preventDefault } =
        createWindowMock(webContentsOverrides);

      closeWindow(window, preventDefault);

      expect(preventDefault).toHaveBeenCalledOnce();
      expect(send).not.toHaveBeenCalled();
      expect(flushSavesMock).toHaveBeenCalledOnce();
      await vi.waitFor(() => expect(quitMock).toHaveBeenCalledOnce());
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

  it('keeps the window open after a timeout if a save failed', async () => {
    flushSavesMock.mockResolvedValue({ status: 'failed', failure });
    const { window, send, preventDefault } = createWindowMock();
    closeWindow(window, preventDefault);
    currentTimestamp += UNRESPONSIVE_TIMEOUT_MS;
    closeWindow(window, preventDefault);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(quitMock).not.toHaveBeenCalled();
    await expect(confirmQuit()).resolves.toEqual({
      status: 'blocked',
      failure,
    });
  });
});

describe('confirmQuit', () => {
  beforeEach(() => {
    resetQuitStateForTesting();
    flushSavesMock.mockReset().mockResolvedValue({ status: 'saved' });
    isDeadMock.mockReset().mockReturnValue(false);
    quitMock.mockReset();
  });

  it('shares a pending blocked result with concurrent callers and allows a later retry', async () => {
    const pendingSave = Promise.withResolvers<SaveResult>();
    flushSavesMock.mockReturnValueOnce(pendingSave.promise);
    const firstQuit = confirmQuit();
    const secondCompleted = vi.fn();
    const secondQuit = confirmQuit().then(secondCompleted);

    await Promise.resolve();
    expect(secondCompleted).not.toHaveBeenCalled();
    expect(flushSavesMock).toHaveBeenCalledOnce();

    pendingSave.resolve({ status: 'failed', failure });
    await expect(firstQuit).resolves.toEqual({ status: 'blocked', failure });
    await secondQuit;
    expect(secondCompleted).toHaveBeenCalledExactlyOnceWith({
      status: 'blocked',
      failure,
    });
    expect(quitMock).not.toHaveBeenCalled();

    await expect(confirmQuit()).resolves.toEqual({ status: 'completed' });
    expect(flushSavesMock).toHaveBeenCalledTimes(2);
    expect(quitMock).toHaveBeenCalledOnce();
  });

  it('shares a rejected quit attempt and allows a later retry', async () => {
    const pendingSave = Promise.withResolvers<SaveResult>();
    flushSavesMock.mockReturnValueOnce(pendingSave.promise);
    const firstQuit = confirmQuit();
    const secondQuit = confirmQuit();
    pendingSave.reject(new Error('Connection lost'));
    await Promise.all([
      expect(firstQuit).rejects.toThrow('Connection lost'),
      expect(secondQuit).rejects.toThrow('Connection lost'),
    ]);
    expect(flushSavesMock).toHaveBeenCalledOnce();
    expect(quitMock).not.toHaveBeenCalled();

    await expect(confirmQuit()).resolves.toEqual({ status: 'completed' });
    expect(flushSavesMock).toHaveBeenCalledTimes(2);
    expect(quitMock).toHaveBeenCalledOnce();
  });

  it('waits for a pending save and quits even if it fails again after explicit discard', async () => {
    flushSavesMock.mockResolvedValue({ status: 'failed', failure });
    await expect(confirmQuit()).resolves.toEqual({
      status: 'blocked',
      failure,
    });
    const pendingSave = Promise.withResolvers<SaveResult>();
    flushSavesMock.mockReturnValueOnce(pendingSave.promise);
    const quitPromise = confirmQuit({ discardUnsavedChanges: true });
    expect(quitMock).not.toHaveBeenCalled();

    pendingSave.resolve({
      status: 'failed',
      failure: { ...failure, id: 'second' },
    });
    await expect(quitPromise).resolves.toEqual({ status: 'completed' });
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('waits for the DB process operations to settle, then quits', async () => {
    let resolveWhenPendingSaves!: () => void;
    flushSavesMock.mockReturnValue(
      new Promise<SaveResult>((resolve) => {
        resolveWhenPendingSaves = () => resolve({ status: 'saved' });
      }),
    );

    const quitPromise = confirmQuit();
    expect(quitMock).not.toHaveBeenCalled();

    resolveWhenPendingSaves();
    await quitPromise;

    expect(flushSavesMock).toHaveBeenCalledTimes(1);
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('quits without waiting when the DB process is dead', async () => {
    isDeadMock.mockReturnValue(true);

    await confirmQuit();

    expect(flushSavesMock).not.toHaveBeenCalled();
    expect(quitMock).toHaveBeenCalledTimes(1);
  });

  it('ignores close attempts while the quit is in progress', async () => {
    let resolveWhenPendingSaves!: () => void;
    flushSavesMock.mockReturnValue(
      new Promise<SaveResult>((resolve) => {
        resolveWhenPendingSaves = () => resolve({ status: 'saved' });
      }),
    );

    const quitPromise = confirmQuit();

    const midSave = createWindowMock();
    closeWindow(midSave.window, midSave.preventDefault);
    expect(midSave.preventDefault).toHaveBeenCalledTimes(1);
    expect(midSave.send).not.toHaveBeenCalled();

    resolveWhenPendingSaves();
    await quitPromise;
  });

  it('lets the window close once quit is finalized', async () => {
    await confirmQuit();
    expect(quitMock).toHaveBeenCalledTimes(1);

    const { preventDefault } = createWindowMock();
    closeWindow(createWindowMock().window, preventDefault);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
