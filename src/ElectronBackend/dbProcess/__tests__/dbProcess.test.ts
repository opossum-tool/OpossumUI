// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import {
  type DbProcessRequest,
  type DbProcessResponse,
  handleDbProcessMessage,
  resetDbProcessStateForTesting,
  type SaveResult,
} from '../dbProcess';

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

type FakePort = { responses: Array<DbProcessResponse> };

function createFakePort(): FakePort {
  const responses: Array<DbProcessResponse> = [];
  return {
    responses,
    postMessage: vi.fn((msg: DbProcessResponse) => {
      responses.push(msg);
    }),
  } as unknown as FakePort;
}

async function handle(
  msg: DbProcessRequest,
): Promise<DbProcessResponse | undefined> {
  const port = createFakePort();
  await handleDbProcessMessage(
    port as unknown as Parameters<typeof handleDbProcessMessage>[0],
    msg,
  );
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

async function awaitIdle(id: number): Promise<DbProcessResponse | undefined> {
  return handle({ id, type: 'whenIdle' });
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
    await loadProject();
    const response = await save(1);

    expect(response?.type).toBe('success');
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
      ignoreReadonlyResourceOutputConflicts: false,
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
      partitionPaths: ['/some/other.opossum'],
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

  it('saves automatically after a successful mutation', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    await awaitIdle(2);

    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
    expect(saveFileApiMock.mock.calls[0]?.[0]).toEqual({
      projectId: 'uuid_1',
      opossumFilePath: '/x',
    });
  });

  it('does not save automatically for queries', async () => {
    await loadProject();
    await runCommand(1, QUERY_COMMAND, false);
    await awaitIdle(2);

    expect(saveFileApiMock).not.toHaveBeenCalled();

    const response = await save(3);
    expect(response?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('skips the automatic save when no project is loaded', async () => {
    await runCommand(1, MUTATION_COMMAND, true);
    await awaitIdle(2);

    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('does not schedule a save for a failed mutation', async () => {
    await loadProject();
    executeCommandMock.mockRejectedValueOnce(new Error('mutation failed'));

    const response = await handle({
      id: 1,
      type: 'executeCommand',
      command: MUTATION_COMMAND,
      params: {},
    } as unknown as DbProcessRequest);

    expect(response?.type).toBe('error');

    await awaitIdle(2);
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('serializes background writes so every successful mutation writes once', async () => {
    await loadProject();

    let resolveFirstSave!: () => void;
    saveFileApiMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstSave = resolve;
        }),
    );

    await runCommand(1, MUTATION_COMMAND, true);
    await runCommand(2, MUTATION_COMMAND, true);
    await runCommand(3, MUTATION_COMMAND, true);
    resolveFirstSave();
    await awaitIdle(4);

    expect(saveFileApiMock).toHaveBeenCalledTimes(3);
  });

  it('does not block whenIdle when an automatic save fails', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));

    await runCommand(1, MUTATION_COMMAND, true);
    await awaitIdle(2);

    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('resolves whenIdle only after the scheduled write finished', async () => {
    await loadProject();

    let resolveSave!: () => void;
    saveFileApiMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    await runCommand(1, MUTATION_COMMAND, true);
    const idlePromise = awaitIdle(2);
    resolveSave();
    expect((await idlePromise)?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('resolves whenIdle after all writes of a mutation burst', async () => {
    await loadProject();

    let resolveFirstSave!: () => void;
    saveFileApiMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstSave = resolve;
        }),
    );

    await runCommand(1, MUTATION_COMMAND, true);
    await runCommand(2, MUTATION_COMMAND, true);
    await runCommand(3, MUTATION_COMMAND, true);
    const idlePromise = awaitIdle(4);
    resolveFirstSave();
    expect((await idlePromise)?.type).toBe('success');
    expect(saveFileApiMock).toHaveBeenCalledTimes(3);
  });
});

describe('dbProcess last save result tracking', () => {
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

  async function getLastSaveResult(
    id: number,
  ): Promise<SaveResult | undefined> {
    const response = await handle({ id, type: 'getLastSaveResult' });
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

    await expect(getLastSaveResult(1)).resolves.toBeUndefined();
  });

  it('reports a successful manual save', async () => {
    await loadProject();
    await save(1);

    await expect(getLastSaveResult(2)).resolves.toBe('success');
  });

  it('reports a failed manual save', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    await save(1);

    await expect(getLastSaveResult(2)).resolves.toBe('failed');
  });

  it('reports success again after a failed save was followed by a successful one', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    await save(1);
    await save(2);

    await expect(getLastSaveResult(3)).resolves.toBe('success');
  });

  it('reports a failed automatic save after a mutation', async () => {
    await loadProject();
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));
    await runCommand(1, MUTATION_COMMAND, true);
    await awaitIdle(2);

    await expect(getLastSaveResult(3)).resolves.toBe('failed');
  });

  it('reports a failed force unlock', async () => {
    await loadProject();
    forceUnlockMock.mockRejectedValueOnce(new Error('write failed'));
    await handle({
      id: 1,
      type: 'forceUnlock',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });

    await expect(getLastSaveResult(2)).resolves.toBe('failed');
  });

  it('reports a failed merge when the merge reports an error result', async () => {
    await loadProject();
    mergeOpossumFilesMock.mockResolvedValueOnce({
      status: 'error',
      errorType: 'Unknown',
      errorMessage: 'merge failed',
    });
    await handle({
      id: 1,
      type: 'mergeOpossumFiles',
      ignoreReadonlyResourceOutputConflicts: false,
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
      partitionPaths: ['/some/other.opossum'],
    });

    await expect(getLastSaveResult(2)).resolves.toBe('failed');
  });

  it('resets the tracked result when another file is loaded', async () => {
    await loadProject();
    await save(1);
    loadFileMock.mockRejectedValueOnce(new Error('load failed'));
    await handle({ id: 2, type: 'loadFile', filePath: '/does-not-exist' });

    await expect(getLastSaveResult(3)).resolves.toBeUndefined();

    await loadProject();
    await expect(getLastSaveResult(4)).resolves.toBeUndefined();
  });
});
