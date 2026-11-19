// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';
import { setImmediate } from 'node:timers/promises';

import { ExportType } from '../../../shared/shared-types';
import {
  type DbProcessRequest,
  type DbProcessResponse,
  handleDbProcessMessage,
  resetDbProcessStateForTesting,
} from '../dbProcess';
import type { SaveResult } from '../save-worker';

const saveFileApiMock = vi.hoisted(() => vi.fn());
const forceUnlockMock = vi.hoisted(() => vi.fn());
const splitOpossumFileMock = vi.hoisted(() => vi.fn());
const mergeOpossumFilesMock = vi.hoisted(() => vi.fn());
const mergeOpossumFilesFromPathsMock = vi.hoisted(() => vi.fn());
const exportFileMock = vi.hoisted(() => vi.fn());
const loadFileMock = vi.hoisted(() => vi.fn());
const executeCommandMock = vi.hoisted(() => vi.fn());
const isMutationCommandMock = vi.hoisted(() => vi.fn());

vi.mock('../../api/saveFile', () => ({ saveFile: saveFileApiMock }));
vi.mock('../../api/forceUnlock', () => ({
  forceUnlockOpossumFile: forceUnlockMock,
}));
vi.mock('../../api/splitOpossumFile', () => ({
  splitOpossumFile: splitOpossumFileMock,
}));
vi.mock('../../api/mergeOpossumFiles', () => ({
  mergeOpossumFiles: mergeOpossumFilesMock,
  mergeOpossumFilesFromPaths: mergeOpossumFilesFromPathsMock,
}));
vi.mock('../../api/exportCommands', () => ({ exportFile: exportFileMock }));
vi.mock('../../input/loadFile', () => ({ loadFile: loadFileMock }));
vi.mock('../../api/commands', () => ({
  executeCommand: executeCommandMock,
  isMutationCommand: isMutationCommandMock,
}));

const MUTATION_COMMAND = 'updateOrMatchAttributions';
const QUERY_COMMAND = 'getResourceTree';

afterEach(() => {
  resetDbProcessStateForTesting();
  vi.useRealTimers();
});

async function tick(): Promise<void> {
  await vi.advanceTimersByTimeAsync(60_000);
}

type FakePort = {
  responses: Array<DbProcessResponse>;
  postMessage: (message: DbProcessResponse) => void;
};

function createFakePort(): FakePort {
  const responses: Array<DbProcessResponse> = [];
  return {
    responses,
    postMessage: vi.fn((msg: DbProcessResponse) => {
      responses.push(msg);
    }),
  };
}

async function handle(
  msg: DbProcessRequest,
): Promise<DbProcessResponse | undefined> {
  const port = createFakePort();
  await handleDbProcessMessage(port, msg);
  return port.responses.at(-1);
}

function loadFileOk(): void {
  loadFileMock.mockResolvedValue({
    ok: true,
    opossumZip: {} as AdmZip,
    projectId: 'uuid_1',
  });
}

async function loadProject(): Promise<void> {
  await handle({ id: 0, type: 'loadFile', filePath: '/x' });
}

async function runCommand(
  id: number,
  command: string,
  isMutation: boolean,
): Promise<void> {
  isMutationCommandMock.mockReturnValue(isMutation);
  await handle({
    id,
    type: 'executeCommand',
    command,
    params: {},
  } as unknown as DbProcessRequest);
}

async function flushSaves(id: number): Promise<DbProcessResponse | undefined> {
  return handle({ id, type: 'flushSaves' });
}

function saveMessage(id: number): DbProcessRequest {
  return {
    id,
    type: 'saveFile',
    projectId: 'uuid_1',
    opossumFilePath: '/some/path.opossum',
  };
}

async function save(id: number): Promise<DbProcessResponse | undefined> {
  return handle(saveMessage(id));
}

describe('dbProcess save tracking', () => {
  beforeEach(() => {
    resetDbProcessStateForTesting();
    saveFileApiMock.mockReset().mockResolvedValue(undefined);
    forceUnlockMock.mockReset().mockResolvedValue(undefined);
    splitOpossumFileMock.mockReset().mockResolvedValue(undefined);
    mergeOpossumFilesMock.mockReset().mockResolvedValue({ status: 'success' });
    mergeOpossumFilesFromPathsMock.mockReset().mockResolvedValue(undefined);
    exportFileMock.mockReset().mockResolvedValue(undefined);
    loadFileMock.mockReset();
    executeCommandMock.mockReset().mockResolvedValue(undefined);
    isMutationCommandMock.mockReset().mockReturnValue(false);
    loadFileOk();
  });

  it('writes the project file when saving manually', async () => {
    vi.useFakeTimers();
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    const response = await save(2);

    expect(response?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    await tick();
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('errors when manually saving without a loaded project', async () => {
    const response = await save(1);

    expect(response?.type).toBe('error');
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('writes again with a manual save after a failed manual save', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));

    const failedResponse = await save(1);
    expect(failedResponse?.type).toBe('error');

    const response = await save(2);
    expect(response?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('writes once for a force unlock', async () => {
    await loadProject();
    await handle({
      id: 1,
      type: 'forceUnlock',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });

    expect(forceUnlockMock).toHaveBeenCalledTimes(1);
  });

  it('works after merging into the current file', async () => {
    await loadProject();
    const response = await handle({
      id: 1,
      type: 'mergeOpossumFiles',
      params: {
        ignoreReadonlyResourceOutputConflicts: false,
        deleteSplitFilesAfterMerge: false,
        saveFileParams: {
          projectId: 'uuid_1',
          opossumFilePath: '/some/path.opossum',
        },
        partitionPaths: ['/some/other.opossum'],
      },
    });

    expect(mergeOpossumFilesMock).toHaveBeenCalledTimes(1);
    expect(response?.type).toBe('success');
  });

  it('works after splitting the current file', async () => {
    await loadProject();
    await handle({
      id: 1,
      type: 'splitOpossumFile',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
      selectedFolderPaths: ['/some/folder'],
      splitOpossumFilePath: '/some/split.opossum',
    });

    expect(splitOpossumFileMock).toHaveBeenCalledTimes(1);
  });

  it('coalesces edits and refetches at the first tick without restarting the clock', async () => {
    vi.useFakeTimers();
    await loadProject();
    const edits: Array<number> = [];
    const snapshots: Array<Array<number>> = [];
    saveFileApiMock.mockImplementation(() => {
      snapshots.push([...edits]);
      return Promise.resolve();
    });
    executeCommandMock.mockImplementation((command) => {
      if (command === MUTATION_COMMAND) {
        edits.push(edits.length + 1);
      }
      return Promise.resolve();
    });
    await runCommand(1, MUTATION_COMMAND, true);
    await runCommand(2, QUERY_COMMAND, false);
    await vi.advanceTimersByTimeAsync(59_999);
    await runCommand(3, MUTATION_COMMAND, true);
    await runCommand(4, QUERY_COMMAND, false);
    expect(saveFileApiMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await tick();

    expect(snapshots).toEqual([[1, 2]]);
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    expect(saveFileApiMock.mock.calls[0]?.[0]).toEqual({
      projectId: 'uuid_1',
      opossumFilePath: '/x',
    });
  });

  it('does not save automatically for queries', async () => {
    vi.useFakeTimers();
    await loadProject();
    await runCommand(1, QUERY_COMMAND, false);
    await tick();

    expect(saveFileApiMock).not.toHaveBeenCalled();

    const response = await save(3);
    expect(response?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('flushes A before loading B and restarts the timer with B clean', async () => {
    vi.useFakeTimers();
    await loadProject();
    await vi.advanceTimersByTimeAsync(30_000);
    await runCommand(1, MUTATION_COMMAND, true);
    const secondArchive = {} as AdmZip;
    loadFileMock.mockImplementationOnce(() => {
      expect(saveFileApiMock).toHaveBeenCalledExactlyOnceWith(
        { projectId: 'uuid_1', opossumFilePath: '/x' },
        expect.anything(),
      );
      return Promise.resolve({
        ok: true,
        projectId: 'uuid_2',
        opossumZip: secondArchive,
      });
    });

    const response = await handle({
      id: 2,
      type: 'loadFile',
      filePath: '/next',
    });
    expect(response?.type).toBe('success');
    expect(vi.getTimerCount()).toBe(1);
    await tick();
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    await runCommand(3, MUTATION_COMMAND, true);
    await vi.advanceTimersByTimeAsync(59_999);
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    expect(saveFileApiMock).toHaveBeenLastCalledWith(
      { projectId: 'uuid_2', opossumFilePath: '/next' },
      secondArchive,
    );
  });

  it('returns a failed flush without retrying in a loop', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));

    await expect(handle({ id: 2, type: 'flushSaves' })).resolves.toEqual({
      id: 2,
      type: 'success',
      result: 'failed',
    });
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('skips the automatic save when no project is loaded', async () => {
    await runCommand(1, MUTATION_COMMAND, true);
    await flushSaves(2);

    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('does not schedule a save for a failed mutation', async () => {
    vi.useFakeTimers();
    await loadProject();
    executeCommandMock.mockRejectedValueOnce(new Error('mutation failed'));

    const response = await handle({
      id: 1,
      type: 'executeCommand',
      command: MUTATION_COMMAND,
      params: {},
    } as unknown as DbProcessRequest);

    expect(response?.type).toBe('error');

    await tick();
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('keeps an edit during a slow save dirty without queuing another periodic write', async () => {
    vi.useFakeTimers();
    await loadProject();
    const write = Promise.withResolvers<void>();
    saveFileApiMock.mockReturnValueOnce(write.promise);

    await runCommand(1, MUTATION_COMMAND, true);
    await tick();
    await runCommand(2, MUTATION_COMMAND, true);
    await tick();
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    write.resolve();
    await setImmediate();
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    await tick();
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('retries a failed autosave on the next tick', async () => {
    vi.useFakeTimers();
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));

    await runCommand(1, MUTATION_COMMAND, true);
    await tick();

    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    await tick();
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('flushes only after the scheduled write finishes', async () => {
    vi.useFakeTimers();
    await loadProject();
    const write = Promise.withResolvers<void>();
    saveFileApiMock.mockReturnValueOnce(write.promise);

    await runCommand(1, MUTATION_COMMAND, true);
    await tick();
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    const port = createFakePort();
    const idleRequest = handleDbProcessMessage(port, {
      id: 2,
      type: 'flushSaves',
    });

    // Give an incorrectly immediate response a chance to arrive before checking.
    await setImmediate();
    expect(port.responses).toEqual([]);

    write.resolve();
    await idleRequest;
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    expect(port.responses).toEqual([
      { id: 2, type: 'success', result: 'success' },
    ]);
  });

  it('flushes a submitted mutation and an edit arriving during the flush write', async () => {
    await loadProject();
    const mutation = Promise.withResolvers<void>();
    executeCommandMock.mockReturnValueOnce(mutation.promise);
    const firstWrite = Promise.withResolvers<void>();
    const lastWrite = Promise.withResolvers<void>();
    saveFileApiMock
      .mockReturnValueOnce(firstWrite.promise)
      .mockReturnValueOnce(lastWrite.promise);

    const submitted = runCommand(1, MUTATION_COMMAND, true);
    const port = createFakePort();
    const idleRequest = handleDbProcessMessage(port, {
      id: 4,
      type: 'flushSaves',
    });

    await setImmediate();
    expect(port.responses).toEqual([]);
    expect(saveFileApiMock).not.toHaveBeenCalled();

    mutation.resolve();
    await submitted;
    await setImmediate();
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    await runCommand(2, MUTATION_COMMAND, true);
    firstWrite.resolve();
    await setImmediate();
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
    expect(port.responses).toEqual([]);

    lastWrite.resolve();
    await idleRequest;
    expect(port.responses).toEqual([
      { id: 4, type: 'success', result: 'success' },
    ]);
  });

  it('serializes a manual save behind a running automatic save', async () => {
    vi.useFakeTimers();
    await loadProject();

    let resolveAutomaticSave!: () => void;
    saveFileApiMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveAutomaticSave = resolve;
        }),
    );

    await runCommand(1, MUTATION_COMMAND, true);
    await tick();
    const manualSavePromise = handle(saveMessage(2));
    resolveAutomaticSave();
    expect((await manualSavePromise)?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('waits for a manual save when flushing', async () => {
    await loadProject();

    let resolveSave!: () => void;
    saveFileApiMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const savePromise = handle(saveMessage(1));
    const idlePromise = flushSaves(2);
    // Let the queued save start writing before resolving it.
    await Promise.resolve();
    resolveSave();
    expect((await idlePromise)?.type).toBe('success');
    expect((await savePromise)?.type).toBe('success');
  });

  it('waits for a force unlock when flushing', async () => {
    await loadProject();

    let resolveUnlock!: () => void;
    forceUnlockMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveUnlock = resolve;
        }),
    );

    const unlockPromise = handle({
      id: 1,
      type: 'forceUnlock',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    const idlePromise = flushSaves(2);
    resolveUnlock();
    expect((await idlePromise)?.type).toBe('success');
    expect((await unlockPromise)?.type).toBe('success');
  });

  it('waits for an export when flushing', async () => {
    let resolveExport!: () => void;
    exportFileMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveExport = resolve;
        }),
    );

    const exportPromise = handle({
      id: 1,
      type: 'exportFile',
      exportType: ExportType.FollowUp,
      filePath: '/some/export.json',
    });
    const idlePromise = flushSaves(2);
    resolveExport();
    expect((await idlePromise)?.type).toBe('success');
    expect((await exportPromise)?.type).toBe('success');
  });

  it('waits for a standalone merge when flushing', async () => {
    let resolveMerge!: () => void;
    mergeOpossumFilesFromPathsMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveMerge = resolve;
        }),
    );

    const mergePromise = handle({
      id: 1,
      type: 'mergeOpossumFilesFromPaths',
      params: {
        ignoreReadonlyResourceOutputConflicts: false,
        deleteSplitFilesAfterMerge: false,
        inputPaths: ['/some/input.opossum'],
        outputPath: '/some/output.opossum',
      },
    });
    const idlePromise = flushSaves(2);
    resolveMerge();
    expect((await idlePromise)?.type).toBe('success');
    expect((await mergePromise)?.type).toBe('success');
  });
});

describe('dbProcess save outcome tracking', () => {
  beforeEach(() => {
    resetDbProcessStateForTesting();
    saveFileApiMock.mockReset().mockResolvedValue(undefined);
    forceUnlockMock.mockReset().mockResolvedValue(undefined);
    splitOpossumFileMock.mockReset().mockResolvedValue(undefined);
    mergeOpossumFilesMock.mockReset().mockResolvedValue({ status: 'success' });
    mergeOpossumFilesFromPathsMock.mockReset().mockResolvedValue(undefined);
    exportFileMock.mockReset().mockResolvedValue(undefined);
    loadFileMock.mockReset();
    executeCommandMock.mockReset().mockResolvedValue(undefined);
    isMutationCommandMock.mockReset().mockReturnValue(false);
    loadFileOk();
  });

  async function getSaveOutcome(id: number): Promise<SaveResult | undefined> {
    const response = await flushSaves(id);
    if (response?.type !== 'success') {
      throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
    }
    const result = response.result;
    if (result !== undefined && result !== 'success' && result !== 'failed') {
      throw new Error(`Unexpected save result: ${JSON.stringify(result)}`);
    }
    return result;
  }

  it('reports no save result before any write happened', async () => {
    await loadProject();

    await expect(getSaveOutcome(1)).resolves.toBeUndefined();
  });

  it('reports a successful manual save', async () => {
    await loadProject();
    await save(1);

    await expect(getSaveOutcome(2)).resolves.toBe('success');
  });

  it('retries a failed manual save on flush', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    expect((await save(1))?.type).toBe('error');

    await expect(getSaveOutcome(2)).resolves.toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('reports success again after a failed save was followed by a successful one', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    await save(1);
    await save(2);

    await expect(getSaveOutcome(3)).resolves.toBe('success');
  });

  it('retries a failed automatic save on flush', async () => {
    vi.useFakeTimers();
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    await runCommand(1, MUTATION_COMMAND, true);
    await tick();

    await expect(getSaveOutcome(3)).resolves.toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('replaces a failed automatic save outcome with a successful manual save', async () => {
    vi.useFakeTimers();
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    await runCommand(1, MUTATION_COMMAND, true);
    await tick();
    await save(3);

    await expect(getSaveOutcome(4)).resolves.toBe('success');
  });

  it('does not let an export overwrite the save outcome', async () => {
    await loadProject();
    exportFileMock.mockRejectedValueOnce(new Error('export failed'));
    await save(1);
    await handle({
      id: 2,
      type: 'exportFile',
      exportType: ExportType.FollowUp,
      filePath: '/some/export.json',
    });

    await expect(getSaveOutcome(3)).resolves.toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('does not record a failed force unlock as a save outcome', async () => {
    await loadProject();
    forceUnlockMock.mockRejectedValueOnce(new Error('write failed'));
    await handle({
      id: 1,
      type: 'forceUnlock',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });

    await expect(getSaveOutcome(2)).resolves.toBeUndefined();
  });

  it('does not record a failed merge as a save outcome', async () => {
    await loadProject();
    mergeOpossumFilesMock.mockResolvedValueOnce({
      status: 'error',
      errorType: 'Unknown',
      errorMessage: 'merge failed',
    });
    await handle({
      id: 1,
      type: 'mergeOpossumFiles',
      params: {
        ignoreReadonlyResourceOutputConflicts: false,
        deleteSplitFilesAfterMerge: false,
        saveFileParams: {
          projectId: 'uuid_1',
          opossumFilePath: '/some/path.opossum',
        },
        partitionPaths: ['/some/other.opossum'],
      },
    });

    await expect(getSaveOutcome(2)).resolves.toBeUndefined();
  });

  it('resets the tracked result when another file is loaded', async () => {
    await loadProject();
    await save(1);
    loadFileMock.mockRejectedValueOnce(new Error('load failed'));
    await handle({ id: 2, type: 'loadFile', filePath: '/does-not-exist' });

    await expect(getSaveOutcome(3)).resolves.toBeUndefined();

    await loadProject();
    await expect(getSaveOutcome(4)).resolves.toBeUndefined();
  });
});
