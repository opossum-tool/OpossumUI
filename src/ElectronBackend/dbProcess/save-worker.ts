// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const DEFAULT_AUTOSAVE_INTERVAL_MS = 60_000;
const AUTOSAVE_INTERVAL_MS = readAutosaveInterval();

function readAutosaveInterval(): number {
  const value = process.env.OPOSSUM_AUTOSAVE_INTERVAL_MS;
  if (value === undefined) {
    return DEFAULT_AUTOSAVE_INTERVAL_MS;
  }

  const interval = Number(value);
  if (Number.isInteger(interval) && interval > 0) {
    return interval;
  }

  console.error(
    `Invalid OPOSSUM_AUTOSAVE_INTERVAL_MS: ${JSON.stringify(value)}. Expected a positive integer; using ${DEFAULT_AUTOSAVE_INTERVAL_MS} ms.`,
  );
  return DEFAULT_AUTOSAVE_INTERVAL_MS;
}

/**
 * Outcome of the last ordinary save of the currently loaded project's file.
 * Split, merge, and force unlock deliberately do not record their writes
 * here, so this neither describes every write nor proves that the file on
 * disk matches the database. `undefined` means no ordinary save happened
 * since the file was loaded.
 */
export type SaveResult = 'success' | 'failed';

/**
 * Owns the lifecycle of tracked operations and project-file saves: what
 * work is pending, in which order saves are written, and what the outcome
 * of the latest ordinary save was. Successful edits are tracked separately
 * from pending work until a save writes them.
 */
export class SaveWorker {
  private readonly writeCurrentProject: () => Promise<void>;
  /**
   * Completion promises of all currently tracked operations and saves.
   * Each promise resolves when its tracked work concludes, so waiting is
   * awaiting this set.
   */
  private readonly pending = new Set<Promise<void>>();
  /**
   * Records only ordinary saves; split, merge, and force unlock write the
   * project file as one of several steps and do not record here.
   */
  private lastSaveResult: SaveResult | undefined;
  private saveTail: Promise<void> = Promise.resolve();
  private dirty = false;
  private autosaveInterval: ReturnType<typeof setInterval> | undefined;

  constructor(options: { writeCurrentProject: () => Promise<void> }) {
    this.writeCurrentProject = options.writeCurrentProject;
  }

  /**
   * Runs the operation and returns its result as soon as it is available.
   * Mutations mark the project dirty before releasing their pending slot.
   */
  run<T>(
    operation: () => Promise<T>,
    options?: { markDirty?: boolean },
  ): Promise<T> {
    return this.track(async () => {
      const result = await operation();
      if (options?.markDirty === true) {
        this.dirty = true;
      }
      return result;
    });
  }

  /**
   * Schedules a save of the current project state and resolves when the
   * write has concluded, rejecting with the write's error.
   */
  save(): Promise<void> {
    return this.track(() => this.enqueueWrite());
  }

  startAutosave(): void {
    this.autosaveInterval ??= setInterval(
      () => this.autosave(),
      AUTOSAVE_INTERVAL_MS,
    );
  }

  stopAutosave(): void {
    clearInterval(this.autosaveInterval);
    this.autosaveInterval = undefined;
  }

  private autosave(): void {
    if (this.dirty && this.pending.size === 0) {
      void this.save().catch((error) => {
        console.error('Automatic save of the .opossum file failed.', error);
      });
    }
  }

  /** Waits for tracked work and persists edits without waiting for a tick. */
  async flush(): Promise<SaveResult | undefined> {
    let writeFailed = false;
    while (true) {
      if (this.pending.size > 0) {
        await Promise.all([...this.pending]);
      } else if (writeFailed || !this.dirty) {
        return writeFailed ? 'failed' : this.lastSaveResult;
      } else {
        try {
          await this.save();
        } catch (error) {
          console.error('Automatic save of the .opossum file failed.', error);
          writeFailed = true;
        }
      }
    }
  }

  /**
   * Runs `work` while counting it as pending tracked work: registers it
   * before it starts and releases the registration once it concludes,
   * successfully or with an error.
   */
  private async track<T>(work: () => Promise<T>): Promise<T> {
    const done = Promise.withResolvers<void>();
    this.pending.add(done.promise);
    try {
      return await work();
    } finally {
      this.pending.delete(done.promise);
      done.resolve();
    }
  }

  /**
   * Appends a write of the current project state to the save tail and
   * records its outcome. The snapshot is read when the write starts, so
   * edits completed during a write stay dirty for the next write.
   */
  private enqueueWrite(): Promise<void> {
    const write = this.saveTail.then(async () => {
      this.dirty = false;
      try {
        await this.writeCurrentProject();
        this.lastSaveResult = 'success';
      } catch (error) {
        this.dirty = true;
        this.lastSaveResult = 'failed';
        throw error;
      }
    });
    // A failed save must not prevent later saves from starting.
    this.saveTail = write.then(
      () => undefined,
      () => undefined,
    );
    return write;
  }
}
