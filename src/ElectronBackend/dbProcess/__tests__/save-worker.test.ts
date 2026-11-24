// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SaveWorker } from '../save-worker';

const INTERVAL_MS = 60_000;

describe('SaveWorker', () => {
  const writeCurrentProject = vi.fn<() => Promise<void>>();
  let worker: SaveWorker;
  let revision: number;

  beforeEach(() => {
    vi.useFakeTimers();
    writeCurrentProject.mockReset().mockResolvedValue(undefined);
    worker = new SaveWorker({
      writeCurrentProject,
      getFileName: () => 'project.opossum',
    });
    revision = 0;
    worker.startAutosave();
  });

  afterEach(() => {
    worker.stopAutosave();
    vi.useRealTimers();
  });

  function edit(nextRevision: number): Promise<void> {
    return worker.run(
      () => {
        revision = nextRevision;
        return Promise.resolve();
      },
      { markDirty: true },
    );
  }

  it('skips clean ticks and coalesces edits without restarting the timer', async () => {
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(writeCurrentProject).not.toHaveBeenCalled();

    const snapshots: Array<number> = [];
    writeCurrentProject.mockImplementation(() => {
      snapshots.push(revision);
      return Promise.resolve();
    });
    await edit(1);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    await edit(2);
    expect(snapshots).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(snapshots).toEqual([2]);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(snapshots).toEqual([2]);
  });

  it('flushes an edit made during autosave without queuing a write at the next tick', async () => {
    const firstWrite = Promise.withResolvers<void>();
    const snapshots: Array<number> = [];
    writeCurrentProject.mockImplementation(() => {
      snapshots.push(revision);
      return snapshots.length === 1 ? firstWrite.promise : Promise.resolve();
    });

    await edit(1);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(snapshots).toEqual([1]);
    await edit(2);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(snapshots).toEqual([1]);

    firstWrite.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(snapshots).toEqual([1]);
    await expect(worker.flush()).resolves.toEqual({ status: 'saved' });
    expect(snapshots).toEqual([1, 2]);
  });

  it('flushes a pending mutation and a later edit without an autosave tick', async () => {
    const mutation = Promise.withResolvers<void>();
    const write = Promise.withResolvers<void>();
    const laterWrite = Promise.withResolvers<void>();
    writeCurrentProject
      .mockReturnValueOnce(write.promise)
      .mockReturnValueOnce(laterWrite.promise);
    const submitted = worker.run(() => mutation.promise, { markDirty: true });
    const completed = vi.fn();
    const flush = worker.flush().then(completed);

    await vi.advanceTimersByTimeAsync(0);
    expect(completed).not.toHaveBeenCalled();
    expect(writeCurrentProject).not.toHaveBeenCalled();

    mutation.resolve();
    await submitted;
    await vi.advanceTimersByTimeAsync(0);
    expect(writeCurrentProject).toHaveBeenCalledOnce();
    expect(completed).not.toHaveBeenCalled();

    await edit(2);
    write.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
    expect(completed).not.toHaveBeenCalled();

    laterWrite.resolve();
    await flush;
    expect(completed).toHaveBeenCalledExactlyOnceWith({ status: 'saved' });
  });

  it('reports repeated autosave failures and recovers without a manual retry', async () => {
    worker.stopAutosave();
    const onFailureChanged = vi.fn();
    worker = new SaveWorker({
      writeCurrentProject,
      getFileName: () => 'project.opossum',
      onFailureChanged,
    });
    worker.startAutosave();
    writeCurrentProject
      .mockRejectedValueOnce(new Error('write failed'))
      .mockRejectedValueOnce(new Error('write failed'));
    await edit(1);

    const result = await worker.flush();
    expect(result).toMatchObject({
      status: 'failed',
      failure: { message: 'write failed' },
    });
    await expect(worker.flush()).resolves.toEqual(result);
    expect(writeCurrentProject).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
    const repeatedResult = await worker.flush();
    expect(repeatedResult).toMatchObject({
      status: 'failed',
      failure: { message: 'write failed' },
    });
    expect(repeatedResult).not.toEqual(result);
    expect(onFailureChanged).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      status: 'failed',
      failure: onFailureChanged.mock.calls[0][0],
    });
    expect(repeatedResult).toEqual({
      status: 'failed',
      failure: onFailureChanged.mock.calls[1][0],
    });

    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(writeCurrentProject).toHaveBeenCalledTimes(3);
    await expect(worker.flush()).resolves.toEqual({ status: 'saved' });
    expect(onFailureChanged).toHaveBeenLastCalledWith(undefined);
  });

  it('starts a queued manual save only after the previous write fails', async () => {
    const firstWrite = Promise.withResolvers<void>();
    const error = new Error('write failed');
    writeCurrentProject.mockReturnValueOnce(firstWrite.promise);
    const failed = worker.save();
    const queued = worker.save();

    await vi.advanceTimersByTimeAsync(0);
    expect(writeCurrentProject).toHaveBeenCalledOnce();
    firstWrite.reject(error);
    await expect(failed).resolves.toMatchObject({
      status: 'failed',
      failure: { message: error.message },
    });
    await expect(queued).resolves.toEqual({ status: 'saved' });
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
    await expect(worker.flush()).resolves.toEqual({ status: 'saved' });
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
  });
});

test('publishes a failure and a clear when an explicit retry succeeds', async () => {
  const writeCurrentProject = vi.fn().mockResolvedValue(undefined);
  const onFailureChanged = vi.fn();
  const worker = new SaveWorker({
    writeCurrentProject,
    getFileName: () => 'project.opossum',
    onFailureChanged,
  });
  writeCurrentProject.mockRejectedValueOnce(new Error('Disk full'));
  const failure = {
    id: expect.any(String),
    fileName: 'project.opossum',
    message: 'Disk full',
  };
  await expect(worker.save()).resolves.toEqual({
    status: 'failed',
    failure,
  });
  expect(onFailureChanged).toHaveBeenCalledExactlyOnceWith(failure);

  await expect(worker.save()).resolves.toEqual({ status: 'saved' });
  await expect(worker.flush()).resolves.toEqual({ status: 'saved' });
  expect(onFailureChanged.mock.calls).toEqual([[failure], [undefined]]);
});
