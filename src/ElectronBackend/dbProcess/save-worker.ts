// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/**
 * Outcome of the last write of the currently loaded project's file.
 * `undefined` means no write happened since the file was loaded (so the
 * file on disk matches the loaded state).
 */
export type SaveResult = 'success' | 'failed';

/**
 * Owns the lifecycle of tracked operations and project-file saves: what
 * work is pending, in which order saves are written, and what the outcome
 * of the latest save was. `waitForPendingSaves` resolves only when nothing
 * is pending anymore, so waiters (e.g. the quit path) can rely on every
 * tracked operation having been executed and every requested save having
 * been written or failed.
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

  constructor(options: { writeCurrentProject: () => Promise<void> }) {
    this.writeCurrentProject = options.writeCurrentProject;
  }

  /**
   * Runs the operation and returns its result as soon as it is available.
   * With `saveInBackground`, a successful operation additionally schedules
   * a save. A failed operation rejects to its caller and does not schedule
   * a save.
   */
  run<T>(
    operation: () => Promise<T>,
    options?: { saveInBackground?: boolean },
  ): Promise<T> {
    // The automatic save is scheduled inside the tracked region, so it is
    // registered before the operation's registration is released.
    return this.track(async () => {
      const result = await operation();
      if (options?.saveInBackground === true) {
        void this.save().catch((error) => {
          console.error('Automatic save of the .opossum file failed.', error);
        });
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

  /**
   * Resolves once every tracked operation and every scheduled save has
   * concluded — including work registered while waiting — and returns the
   * outcome of the latest save. `undefined` means no save happened since
   * the file was loaded.
   */
  async waitForPendingSaves(): Promise<SaveResult | undefined> {
    while (this.pending.size > 0) {
      await Promise.all([...this.pending]);
    }
    return this.lastSaveResult;
  }

  /** Clears the recorded save outcome, e.g. when another file is loaded. */
  resetSaveOutcome(): void {
    this.lastSaveResult = undefined;
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
   * the last write reflects every mutation completed before it was
   * scheduled.
   */
  private enqueueWrite(): Promise<void> {
    const write = this.saveTail.then(async () => {
      try {
        await this.writeCurrentProject();
        this.lastSaveResult = 'success';
      } catch (error) {
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
