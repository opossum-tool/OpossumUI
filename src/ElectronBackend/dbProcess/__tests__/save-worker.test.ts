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
    worker = new SaveWorker({ writeCurrentProject });
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
    await expect(worker.flush()).resolves.toBe('success');
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
    expect(completed).toHaveBeenCalledExactlyOnceWith('success');
  });

  it('returns a failed flush without spinning and retries at the next tick', async () => {
    writeCurrentProject.mockRejectedValueOnce(new Error('write failed'));
    await edit(1);

    await expect(worker.flush()).resolves.toBe('failed');
    expect(writeCurrentProject).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
    await expect(worker.flush()).resolves.toBe('success');
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
  });

  it('starts a queued manual save only after the previous write fails', async () => {
    const firstWrite = Promise.withResolvers<void>();
    const error = new Error('write failed');
    writeCurrentProject.mockReturnValueOnce(firstWrite.promise);
    const failed = worker.save().catch((reason: unknown) => reason);
    const queued = worker.save();

    await vi.advanceTimersByTimeAsync(0);
    expect(writeCurrentProject).toHaveBeenCalledOnce();
    firstWrite.reject(error);
    await expect(failed).resolves.toBe(error);
    await queued;
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
    await expect(worker.flush()).resolves.toBe('success');
    expect(writeCurrentProject).toHaveBeenCalledTimes(2);
  });
});
