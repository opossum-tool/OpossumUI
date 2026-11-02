// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type AdmZip from 'adm-zip';

import {
  type DbProcessRequest,
  type DbProcessResponse,
  handleDbProcessMessage,
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
  loadFileMock.mockResolvedValue({ ok: true, opossumZip: {} as AdmZip });
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

  it('skips saving while the file is fresh after loading', async () => {
    await loadProject();
    const response = await save(1);

    expect(response?.type).toBe('success');
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('marks the file stale on mutations and saves once', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    await save(2);
    await save(3);

    expect(saveFileApiMock).toHaveBeenCalledTimes(1);
  });

  it('does not mark the file stale on queries', async () => {
    await loadProject();
    await runCommand(1, QUERY_COMMAND, false);
    const response = await save(2);

    expect(response?.type).toBe('success');
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('keeps the file stale when a save fails', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    saveFileApiMock.mockRejectedValueOnce(new Error('write failed'));

    const failedResponse = await save(2);
    expect(failedResponse?.type).toBe('error');

    await save(3);
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the file stale when a mutation arrives while a save is writing', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);

    let resolveSave!: () => void;
    saveFileApiMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );
    const savePromise = save(2);
    await runCommand(3, MUTATION_COMMAND, true);
    resolveSave();
    const firstSaveResponse = await savePromise;
    expect(firstSaveResponse?.type).toBe('success');

    await save(4);
    expect(saveFileApiMock).toHaveBeenCalledTimes(2);
  });

  it('marks the file saved after a force unlock', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    await handle({
      id: 2,
      type: 'forceUnlock',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
    });
    const response = await save(3);

    expect(forceUnlockMock).toHaveBeenCalledTimes(1);
    expect(response?.type).toBe('success');
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('marks the file saved after merging into the current file', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    await handle({
      id: 2,
      type: 'mergeOpossumFiles',
      ignoreReadonlyResourceOutputConflicts: false,
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
      partitionPaths: ['/some/other.opossum'],
    });
    const response = await save(3);

    expect(mergeOpossumFilesMock).toHaveBeenCalledTimes(1);
    expect(response?.type).toBe('success');
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });

  it('marks the file saved after splitting the current file', async () => {
    await loadProject();
    await runCommand(1, MUTATION_COMMAND, true);
    await handle({
      id: 2,
      type: 'splitOpossumFile',
      projectId: 'uuid_1',
      opossumFilePath: '/some/path.opossum',
      selectedFolderPaths: ['/some/folder'],
      splitOpossumFilePath: '/some/split.opossum',
    });
    const response = await save(3);

    expect(splitOpossumFileMock).toHaveBeenCalledTimes(1);
    expect(response?.type).toBe('success');
    expect(saveFileApiMock).not.toHaveBeenCalled();
  });
});
